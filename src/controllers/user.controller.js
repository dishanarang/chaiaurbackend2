import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";
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
    const existedUser=User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"user with email or username already exists")
    }
    //this is given by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

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




// const loginUser=asyncHandler(async (req,res)=>{
//     res.status(200).json({
//         message:"ok"
//     })
// })

export {registerUser}