import { NextRequest, NextResponse } from 'next/server';
import { BotDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { ensureDatabase } from '@/lib/db-init';

// GET /api/bots/[id] - Get a specific bot
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await ensureDatabase();
    const bot = await BotDB.findById(params.id, user.userId);

    if (!bot) {
      return NextResponse.json(
        { message: 'Bot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ bot });
  } catch (error) {
    console.error('Error fetching bot:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/bots/[id] - Update a bot
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await ensureDatabase();
    const data = await request.json();
    await BotDB.update(params.id, user.userId, data);

    const bot = await BotDB.findById(params.id, user.userId);

    return NextResponse.json({ bot });
  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/bots/[id] - Delete a bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await ensureDatabase();
    await BotDB.delete(params.id, user.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
