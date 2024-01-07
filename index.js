const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://aulex500:500pauli@cluster0.n9nnpwv.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  otp: String,
  verified: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aulex500@gmail.com',
    pass: 'xwrd zhyq seyg bcod'
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send({ message: 'User with this email already exists' });
  }

  // Generate OTP and save the new user
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ firstName, lastName, email, password: hashedPassword, otp });

  try {
    await newUser.save();

    // Send OTP to user's email using Nodemailer
    const mailOptions = {
      from: 'aulex500@gmail.com',
      to: email,
      subject: 'OTP for Registration',
      text: `Your OTP for registration is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error(error.message);
      }
      console.log('Email sent: ' + info.response);
    });

    res.send({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email, otp });

    if (!user) {
      return res.status(400).send({ message: 'Invalid OTP' });
    }

    user.verified = true;
    await user.save();

    res.send({ message: 'OTP verified successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }

    // Check if the user is verified
    if (!user.verified) {
      return res.status(401).send({ message: 'User not verified. Please verify your email first.' });
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      return res.send({ message: 'Login successful!' });
    } else {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
