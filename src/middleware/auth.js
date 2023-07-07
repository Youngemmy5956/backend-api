
import jwt from "jsonwebtoken";

const config = process.env.JWT_SECRECT_KEY;

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    try {
      jwt.verify(token, config, (err) => {
        if (err) {
          return res.status(401).json({ message: "Invalid Token" });
        } else {
          next();
        }
      });
    } catch (err) {
      return res.status(401).send("Invalid Token");
    }
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" });
  }
};

export default verifyToken;
