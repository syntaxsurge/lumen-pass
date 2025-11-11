import { NextResponse } from 'next/server'

import { registerMappingWithOwnerSecret } from '@/lib/stellar/registrar-service'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      courseId?: string
    }
    const courseId = body?.courseId?.trim()
    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    const ownerSecret = process.env.REGISTRAR_OWNER_SECRET?.trim()
    if (!ownerSecret) {
      return NextResponse.json(
        { error: 'Registrar owner secret not configured on server' },
        { status: 500 }
      )
    }

    const { txHash } = await registerMappingWithOwnerSecret({
      name: courseId,
      ownerSecret
    })
    return NextResponse.json({ txHash })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

