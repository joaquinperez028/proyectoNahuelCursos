import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Pack from '@/models/Pack';

export async function GET(request, context) {
  await connectToDatabase();
  const pack = await Pack.findById(context.params.id).populate('courses', 'title');
  if (!pack) {
    return NextResponse.json({ error: 'Pack no encontrado' }, { status: 404 });
  }
  return NextResponse.json(pack);
} 