# Anuncia Lucas

Aplicativo local de pedidos de serviços e anúncios/procuras de imóveis de Lucas do Rio Verde, por Nova-byte Tecnologia.

Site: https://luandersonjesussantos063-eng.github.io/lucas-agora/

## Versão de preparação para teste fechado

- Identidade Anuncia Lucas, ícones e páginas de privacidade, termos, suporte e exclusão.
- Denúncias registradas em `content_reports`, bloqueios em `user_blocks` e pedidos de exclusão em `account_deletion_requests`.
- Políticas de acesso revisadas: perfil privado, disponibilidade da própria empresa, propostas protegidas e contato privado condicionado à escolha do cliente.
- Android com Capacitor 8, `targetSdkVersion` 36, identificador `br.com.novabytesolucoes.anuncialucas`.

O projeto Android e os testes são entregues no pacote de código-fonte. A chave de assinatura é entregue separadamente e **nunca deve ser adicionada a este repositório**.

## Banco existente

**Não execute novamente `supabase_schema.sql` nem `supabase_schema_para_copiar.txt` em produção. São arquivos históricos do MVP e não refletem o esquema atual.** As alterações de 21/09/2026 já foram aplicadas ao projeto. O pacote de código-fonte contém suas migrações e testes com transações desfeitas ao final.

## Operação antes de publicar

O responsável deve acompanhar denúncias e pedidos de exclusão no painel do Supabase e no e-mail luandersonjesussantos063@gmail.com. A solicitação no app não apaga imediatamente a conta: o suporte confirma e processa, removendo também fotos do Storage e revogando sessões antes de excluir o usuário.

Não há pagamentos nem planos pagos nesta versão. O conteúdo é criado por usuários. O teste fechado, a ficha de Segurança dos dados e a aprovação do Google Play ainda precisam ser concluídos.
