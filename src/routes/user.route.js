import {Router} from "express";
import { logoutUser,loginUser,registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; 
import { verifyJWT } from "../middlewares/auth.middleware.js";
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


router.route("/login").post(loginUser)

//secured routes
//verifyJWT is a middleware
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)

export default router;