-- Placas dos caminhões no padrão Mercosul: 7 caracteres, maiúsculas, sem hífen (ex.: RGK-1F44 -> RGK1F44).
update public.vehicles
set identificador = upper(regexp_replace(identificador, '[^A-Za-z0-9]', '', 'g'))
where tipo = 'veiculo'
  and identificador <> upper(regexp_replace(identificador, '[^A-Za-z0-9]', '', 'g'));
