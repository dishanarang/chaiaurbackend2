import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema=new Schema(
    {
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    
    avatar:{
        type:String, //clouidinary url
        required:true,
    },
    coverImage:{
        type:String, //clouidinary url
    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    } 
},
{timestamps:true})

//pre is a middle ware used to do some task just before another task, here this task will be done just before saving user data
//next() [a flag type of thing] is used to go from one middleware to another
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10)
    next()
})
//to check if password is correct or not
userSchema.methods.isPasswordCorrect=async function(password){
   return await  bcrypt.compare(password, this.password)  //will return true or false
}


userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname

       },
       process.env.ACCESS_TOKEN_SECRET,
       {
           expiresIn:process.env.ACCESS_TOKEN_EXPIRY
       }
       
    )

}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
       },
       process.env.REFRESH_TOKEN_SECRET,
       {
           expiresIn:process.env.REFRESH_TOKEN_EXPIRY
       }
       
    )
}
export const User=mongoose.model('User',userSchema)