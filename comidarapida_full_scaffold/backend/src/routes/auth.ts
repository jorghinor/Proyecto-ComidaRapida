import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { decode } from 'next-auth/jwt'; // Importar decode para verificar el token de admin

const prisma = new PrismaClient();
const router = Router();

// Endpoint para el login de credenciales
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: userPassword, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });

  } catch (error: any) {
    console.error('Backend login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint para el registro de nuevos usuarios
router.post('/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    let userRole = 'client'; // Rol por defecto
    // Si la petición incluye un rol y el usuario que hace la petición es un admin, usar ese rol
    if (role) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenString = authHeader.split(' ')[1];
        const secret = process.env.NEXTAUTH_SECRET;
        if (secret) {
          const token = await decode({ token: tokenString, secret: Buffer.from(secret) });
          if (token && token.role === 'admin') {
            if (role === 'admin' || role === 'client') {
              userRole = role;
            }
          }
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
        role: userRole,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
});

export default router;
