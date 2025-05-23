import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
} 