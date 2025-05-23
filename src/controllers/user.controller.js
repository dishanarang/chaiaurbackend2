import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens=async (userId)=>{
    try{
        //getting the reference of our user from the database since we have the userid
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        //the refresh token needs to be saved in the database as well
        user.refreshToken=refreshToken
        
        await user.save({validateBeforeSave:false})

        return{accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
}

const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend
    //validation->not empty
    //check if user already exist: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object->create entry in DB
    //remove password and refresh token field from response
    //check for user creation
    //return res
    
    //destructuring the request
    const {fullName,username,email,password}=req.body

    //to check if all fields are non empty
    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"all field are required")
    }

    //to check if user already exists or not
    const existedUser=await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"user with email or username already exists")
    }
    //this is given by multer(req.files ka access, multer middleware ne req ke andar aur cheeze add kar di like req.body is given by express)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;
    //console.log(req.body)

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    //avatar is required , coverImage is not compulsory
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    //create entry in the db
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    //to check if user is created or not, if yes mongoDB gives it an id so we are checking if that exists or not
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user(server ki galati hai)")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
 
})

const loginUser=asyncHandler(async(req,res)=>{
    //req.body->data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email,username,password }=req.body
    
    //ensuring that atleast one of the username/email fields is non empty
    if(!username && !email){
        throw new ApiError(400,"username or email required")
    }
    //checking if user exists or not
    const user=await User.findOne({
        $or:[{username},{email}]
    })  

    if(!user){
        throw new ApiError(404, "user does not exist")
    }
    //now user exists, so now we check if the password is entered correctly or not

    //isPasswordCorrect is in our user, that's why using user and not User
   const isPasswordValid=await user.isPasswordCorrect(password)

   if(!isPasswordValid){
        throw new ApiError(401, "password incorrect")
    }

    //password is correct so now we generate access and refresh tokens

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id) //now we got our tokens
    //now lets ask DB for the response, user jo reponse mila tha usme refreshToken was empty and usme password bhi aya tha
    //now we want a reponse jaha yeh do field na ho isliye lets make another DB call to get the response
    //we can also update our user or make another DB call, our choice
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    //now we need to design cookie
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged In successfully"
        )
    )


})

const logoutUser=asyncHandler(async (req,res)=>{
    //clear the cookies
    //reset the refresh token from the database
    await User.findByIdAndUpdate(
        req.user._id,
        //now tell what to update
        {
            //these fields will get updated in mongoDB
            $set:{
                refreshToken:undefined
            }
        },
        //yeh karne se jo return mei response milega usme new updated value milegi
        {
            new:true
        }
    )
    //now we will clear the cookies
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200) 
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(new ApiResponse(200,{},"user logged out"))
} )

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user= await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
        //checking it with the value in the database
        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
        //let us generate new tokens now
        const options={
            httpOnly:true,
            secure:true
        }
        
        const{accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "Access toke refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const{oldPassword, newPassword, confirmPassword}=req.body
    //req.user is there since before running this we are going to use verifyJWT middleware, since a loggedin User can only change their password
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password")
    }
    if(newPassword!==confirmPassword){
        throw new ApiError(400, "New password and confirm password don't match")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    //since user is logged in , we have req.user(injected by verifyJWT middleware)
    const user=await User.findById(req.user?._id)
    return res
    .status(200)
    .json(200, user, "current user fetched susscessfully")
})  

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
   const avatarLocalPath= req.file?.path
   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }
   const avatar=await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on cloudinary")
   }
   //now only logged in user can update avatar, therefore we must have used our middeware verifyJWT, so req.user is injected. 
   const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
   ).select("-password");

   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"Avatar updated successfully")
   )


})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
   const coverImageLocalPath= req.file?.path
   if(!coverImageLocalPath){
    throw new ApiError(400,"conver image file is missing")
   }
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on cloudinary")
   }
   //now only logged in user can update coverImage, therefore we must have used our middeware verifyJWT, so req.user is injected. 
   const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }
    },
    {new:true}
   ).select("-password");

   return res
   .status(200)
   .json(
    new ApiResponse(200,user,"Cover Image updated successfully")
   )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}