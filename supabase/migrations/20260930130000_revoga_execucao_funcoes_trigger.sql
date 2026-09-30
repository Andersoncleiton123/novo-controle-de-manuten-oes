-- Funções de trigger não precisam ser chamadas pela API.
revoke execute on function public.fn_auditoria() from authenticated;
revoke execute on function public.fn_novo_usuario() from authenticated;
revoke execute on function public.vincula_plano_fluidos_betoneira() from authenticated;
