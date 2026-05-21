// nexia_build/netlify/functions/ai-agent.js
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { tenantId, prompt } = JSON.parse(event.body);

    // 🔒 A CHAVE AGORA É SECRETA E VEM DO NETLIFY (Environment Variables)
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: '⚠️ NEXIA CORTEX: Chave da API não configurada no servidor Netlify.' })
        };
    }

    const systemPrompt = `Você é o CORTEX, a inteligência artificial avançada da plataforma NEXIA OS. O ID do cliente (Tenant) atual é: ${tenantId}. Você atua como analista de dados e estrategista. Seja executivo, focado em vendas e operações B2B. Use respostas curtas, profissionais e com emojis.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://nexiaos.netlify.app',
        'X-Title': 'NEXIA OS'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: '⚠️ Os servidores neurais do NEXIA OS estão ocupados. Tente novamente.' })
    };
  }
};