// Cloudflare Workers - BingX API Proxy
// 이 코드를 Cloudflare Workers에 배포하세요

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-BX-APIKEY, X-BX-SIGNATURE, X-BX-TIMESTAMP',
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // 클라이언트로부터 받은 요청 파싱
    const url = new URL(request.url)
    const path = url.searchParams.get('path') // BingX API 엔드포인트

    if (!path) {
      return new Response(JSON.stringify({ error: 'path parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // BingX API로 전달할 파라미터
    const apiKey = request.headers.get('X-BX-APIKEY')
    const signature = request.headers.get('X-BX-SIGNATURE')
    const queryString = url.searchParams.get('query') || ''

    if (!apiKey || !signature) {
      return new Response(JSON.stringify({ error: 'API Key and Signature are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // BingX API 호출
    const bingxUrl = `https://open-api.bingx.com${path}?${queryString}&signature=${signature}`

    const bingxResponse = await fetch(bingxUrl, {
      method: 'GET',
      headers: {
        'X-BX-APIKEY': apiKey
      }
    })

    const data = await bingxResponse.json()

    // 클라이언트에 응답 반환
    return new Response(JSON.stringify(data), {
      status: bingxResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}
