import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'    //fs->file system (node js ki default file system)

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
//locaFilePath hai matlab file humare server par hai
const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //to remove file from our server
        fs.unlinkSync(localFilePath);
        //file has been uploaded successfully
        console.log('file is uploaded on cloudinary',response.url);
        return response;
    }
    catch(error){
        //removing file from our server to avoid malicious content
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}


export {uploadOnCloudinary}
