const jwt = require('jsonwebtoken');

const handleSignUpError = (err) => {
    let error = {
        username: "",
        email: "",
        password: "",
        role: "",
    };
    if (err.code === 11000){
        if (err.keyValue.email){
            error.email = "Email already taken";
        }else if(err.keyValue.username){
            error.username = "Username already taken";
        }
    }
    else if(err.errors.username)
        error.username = err.errors.username.message;
    else if(err.errors.password)
        error.password = err.errors.password.message
    else if(err.errors.email)
        error.email = "Please enter a valid email";
    else if(err.errors.role)
        error.role = "Please mention a role";
    return error;
}

const handleLogInError = (err) => {
    let errors = { username: '', password: '' };
    if (err.message === 'User not found') {
        errors.username = err.message;
    } else if (err.message === 'Invalid password') {
        errors.password = err.message;
    }
    return errors;
}


const maxAge = 86400; // 3 days in seconds
const createToken = (username) => {
    return jwt.sign(
        { username : username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: maxAge, },
    );
};

module.exports = {
    handleSignUpError,
    handleLogInError,
    createToken
}
