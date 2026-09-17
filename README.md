# CondoConecta

Sistema web responsivo para concentrar a rotina de um condomínio: comunicados, reservas de áreas comuns, chamados de manutenção e ocorrências.

Criado pela empresa fictícia **NexoHab Tecnologia** como parte de uma atividade acadêmica. O condomínio e os dados exibidos são fictícios.

## O que é possível demonstrar

- Consultar e publicar comunicados.
- Solicitar reservas e impedir dois pedidos para o mesmo horário.
- Criar, atribuir e acompanhar chamados de manutenção.
- Registrar ocorrências com visibilidade restrita ao autor e à gestão.
- Alternar entre os perfis de administradora, síndico, morador, funcionário e outro morador para demonstrar permissões.
- Consultar histórico de cada solicitação.

## Regras da demonstração

- Reservas podem ser solicitadas de amanhã até 90 dias à frente, entre 8h e 22h, por até seis horas.
- Reservas pendentes e confirmadas bloqueiam o horário escolhido.
- Chamados têm fluxo de acompanhamento: aberto, triagem, em andamento, aguardando recurso e concluído.
- Ocorrências não aparecem em mural público. Notas internas ficam visíveis somente para a gestão.
- O seletor de perfis existe apenas para a apresentação acadêmica; em uma implantação real, cada usuário teria seu vínculo e permissões próprios.

## Equipe

| Integrante | Papel |
| --- | --- |
| Luis Gustavo | Full Stack, Back-end e Product Owner |
| João Vittor Monteiro | Front-end e Product Owner  |
| João Vitor Simões | Front-end |
| João Gabriel Camara | Back-end |
| João Carlos | Back-end |

## Documentação da atividade

Os documentos de proposta, requisitos, papéis profissionais, postagens simuladas para LinkedIn, cuidados com privacidade e roteiro de apresentação estão em [outputs/condoconecta](outputs/condoconecta/README.md).

## Execução local

Requer Node.js 22 ou superior.

```powershell
npm install
npm run build
npm run db:setup
npm run dev
```

Abra `http://127.0.0.1:5173`. Na prévia local, entre pela tela inicial para usar a conta fictícia de demonstração.

## Verificações realizadas

```powershell
npm run typecheck
npm run test:api
```

Os testes de integração cobrem autenticação, permissões entre perfis, histórico, notas internas, atualização concorrente, validação de campos e reserva concorrente do mesmo horário.

## Limites desta versão

É uma demonstração acadêmica. Não inclui anexos, cobrança, controle de acesso físico, integração com mensageria ou canal de emergência. Não use informações reais de moradores durante a apresentação.
