import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; 
const router=Router();
//upload is a middleware(multer to upload files), (so before going to registerUser, meet me(middleware))
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)
//router.route("/login").post(loginUser)

export default router;