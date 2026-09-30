import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PERMISSOES } from "@/lib/permissions";

export default function PermissoesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Permissões por perfil</h1>
        <p className="text-sm text-gray-500">O que cada perfil pode fazer no sistema.</p>
      </div>
      <Card>
        <CardHeader title="Administrador e consultor" subtitle="Administrador: vendas@uniccar.com.br" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Área</th>
                  <th className="px-4 py-2 font-medium">Funcionalidade</th>
                  <th className="px-4 py-2 text-center font-medium">Administrador</th>
                  <th className="px-4 py-2 text-center font-medium">Consultor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PERMISSOES.map((p) => (
                  <tr key={p.funcionalidade}>
                    <td className="px-4 py-2 text-gray-500">{p.grupo}</td>
                    <td className="px-4 py-2 text-gray-900">{p.funcionalidade}</td>
                    <td className="px-4 py-2 text-center">{p.admin ? "Sim" : "Não"}</td>
                    <td className={`px-4 py-2 text-center ${p.consultor ? "" : "text-red-600"}`}>
                      {p.consultor ? "Sim" : "Não"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
