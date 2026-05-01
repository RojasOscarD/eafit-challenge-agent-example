import { NextRequest, NextResponse } from 'next/server';
import { BotDB, UserDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { ensureDatabase } from '@/lib/db-init';

// GET /api/bots - List all bots for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bots = await BotDB.findByUserId(user.userId);
    const userData = await UserDB.findById(user.userId);

    return NextResponse.json({
      bots,
      user: userData,
    });
  } catch (error) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bots - Create a new bot
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { message: 'Bot name is required' },
        { status: 400 }
      );
    }

    const result = await BotDB.create(user.userId, data);

    return NextResponse.json({
      bot: {
        id: result.id,
        slug: result.slug,
      },
    });
  } catch (error) {
    console.error('Error creating bot:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
