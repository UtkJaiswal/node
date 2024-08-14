import { Request, Response } from 'express';
import User from '../models/user';
import jwt from 'jsonwebtoken';
import { sendVerificationCode } from '../utils/twilio';
import { verifyCode  } from '../utils/twilio';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();


const generateToken = (userId: number) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN });
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  try {
    
    const user = await User.create({ name, email, phone, password });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message:error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
  
    try {
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      
      const isMatch = await User.comparePassword(user.password, password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);

      res.json({ message: 'Login successful', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error', message:error});
    }
};

export const isPhoneRegistered = async (req: Request, res: Response): Promise<Response | void> => {
    try {

        const phone = req.body.phone;

        const user = await User.findOne({ where : { phone: phone}})
        let isRegistered = false
        let user_id

        if(user) {
            isRegistered = true
        }

        const result = {
            "phone": phone,
            "isRegistered": isRegistered
        }

        return res.status(200).json({
            status: 'success',
            result: result,
            message: "Registration check successful"
        });
    }   catch (error) {
        console.error("Error is:",error)
        res.status(500).json({ error: 'Internal Server Error', message:error});
    }
}


export const sendOTP = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const phone: string = req.body.phone;
        const isRegistered = req.body.isRegistered;
        let name = ""

        if (!isRegistered) {
            name = req.body.name

            if (!name || name=="") {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Name cannot be empty'
                }); 
            }
        }
      
        const resp = await sendVerificationCode(phone);


        if (!resp) {
            return res.status(400).json({
            status: 'fail',
            message: 'Bad request'
            });
        }

        const result = {
            "name": name,
            "phone": phone,
            "result": resp
        }

        return res.status(200).json({
            status: 'success',
            result: result,
            message: "OTP sent successfully",

        });
    }   catch (error) {
        console.error("Error is:",error)
        res.status(500).json({ error: 'Internal Server Error', message:error});
    }
};

export const verifyOTP = async (req: Request, res: Response): Promise<Response | void>  => {
    try {
        const phone: string = req.body.phone;
        const code: string = req.body.code;
        const name: string = req.body.name

        
        const resp = await verifyCode(phone, code);

        if (!resp) {
            return res.status(400).json({
              status: 'fail',
              message: 'OTP verification failed'
            });
        }

        const user = await User.findOne({ where : { phone: phone}})
        let user_id, isEmailVerified = false

        if(!user) {

            if (!name || name=="") {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Name cannot be empty'
                }); 
            }

            const new_user = await User.create({ name, phone});
            isEmailVerified = false;
            user_id = new_user.id
        } else {
            user_id = user.id
            isEmailVerified = user.isEmailVerified
        }

        const token : string = generateToken(user_id)
        const result = {
            token: token,
            isEmailVerified: isEmailVerified
        }
        
        return res.status(200).json({
            status: 'success',
            result: result,
            message: "OTP verified successfully"
        })
    } catch (error) {
        console.error("Error is:",error)
        res.status(500).json({ error: 'Internal Server Error', message:error});

    }
}

export const sendVerificationEmail = async (req: Request, res: Response): Promise<Response | void> => {
    try {

        const user_id = (req as any).user?.id; 
        const email = req.body.email
        
        const user = await User.findOne({ where: {id: user_id}})
        
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found',
            });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email already verified',
            });
        }
        
        const verificationToken = uuidv4()
        

        user.emailVerificationToken= verificationToken
        user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save()
       

        const transporter = nodemailer.createTransport({
            host: process.env.NODE_MAILER_HOST,
            port: 587,
            auth: {
                user: process.env.NODE_MAILER_USER,
                pass: process.env.NODE_MAILER_PASSWORD
            }
        })
        const base_url = process.env.BASE_URL

        const verificationLink = `${base_url}/users/verify/${verificationToken}`;
    
        const result = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: 'Verify your email',
            text: `Please click the following link to verify your email: ${verificationLink}`,
            html: `<p>Please click the following link to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
          });

        res.status(200).json({ message: "Verification mail sent successfully"})

    } catch (error) {
        console.error("Error is:", error)
        res.status(500).json({ error:"Internal Server Error", message: error})
    }
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
    
        const user = await User.findOne({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: {
                    [Op.gt]: new Date()
                }
            }
      });
  
      if (!user) {
        res.status(400).json({ error: 'Invalid or expired verification token' });
        return;
      }
  
      user.isEmailVerified = true;
      await user.save();
  
      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
      });
    } catch (error) {
        console.error("Error is:",error)
        res.status(500).json({ error: 'Internal Server Error', message:error});
    }
  };