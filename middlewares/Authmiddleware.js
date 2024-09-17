const jwt = require('jsonwebtoken')
const authentication = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(" ")[1];
    const isValidToken = jwt.verify(token, 'finance_user')
    
    if (isValidToken.user.id===req.params.userId){
        next()
    }
    else{
        res.status(401).json({message: 'Unauthorized'})
    }
  } catch (error) {
    console.log(error, 'error from auth middleware..')
    return error
  }
};

module.exports = authentication;
