import { NextRequest, NextResponse } from 'next/server';
import { BotDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { undeployBot } from '@/lib/k8s';
import { ensureDatabase } from '@/lib/db-init';

// POST /api/bots/[id]/unpublish - Remove bot from Kubernetes
export async function POST(
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

    const undeploymentResult = await undeployBot(bot);

    if (undeploymentResult.success) {
      await BotDB.updateStatus(params.id, user.userId, 'draft');

      return NextResponse.json({
        success: true,
      });
    } else {
      return NextResponse.json(
        { message: undeploymentResult.error || 'Undeployment failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error unpublishing bot:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
