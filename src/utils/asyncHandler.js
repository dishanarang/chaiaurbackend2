const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))
    }
}

export {asyncHandler}



//You are passing a function fn, and asyncHandler(fn) returns a wrapped async version of that same function — with built-in error handling.
// const asyncHandler(fn)=> async(req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     } 
//     catch(err){
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }

//the above can also be written as --> 
// const asyncHandler=(fn)=> {
//     return async () => {} 
// }