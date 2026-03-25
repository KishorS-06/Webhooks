const User = require("../models/User")
const bcrypt = require("bcryptjs")

exports.signup = async(req,res)=>{
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await User.create({
      email,
      password: hash
    })

    res.status(201).json({
      message: "User created successfully",
      userId: user._id
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.login = async(req,res)=>{
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await User.findOne({ email })
    
    if(!user) {
      return res.status(400).json({ error: "User not found" })
    }

    const valid = await bcrypt.compare(password, user.password)
    
    if(!valid) {
      return res.status(400).json({ error: "Wrong password" })
    }

    res.json({
      message: "Login successful",
      userId: user._id,
      email: user.email
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}