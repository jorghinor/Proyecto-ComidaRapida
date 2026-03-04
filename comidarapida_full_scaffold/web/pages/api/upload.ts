import type { NextApiRequest, NextApiResponse } from 'next'
/*
  This endpoint is a placeholder showing how to accept an image upload
  and forward to Cloudinary. For simplicity in the scaffold we return
  a mock response. Implement multipart parsing and Cloudinary SDK in production.
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).end();
  // In production, parse file and upload to Cloudinary.
  res.status(200).json({ url: '/demo/saltena.jpg', public_id: 'demo/saltena' });
}
