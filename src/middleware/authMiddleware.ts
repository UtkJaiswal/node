import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config()


interface JWTPayload {
    id: string;
  }
  

declare global {
    namespace Express {
      interface Request {
        user?: JWTPayload;
      }
    }
  }

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {

    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header provided' });
        return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ error: 'Authorization header must be in the format "Bearer <token>"' });
        return;
    }

    const token = parts[1];
    

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return
    }
};

export default authMiddleware;
