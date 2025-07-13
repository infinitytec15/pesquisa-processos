import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Movimentacao {
  data: string;
  descricao: string;
}

interface Partes {
  requerente: string;
  requerido: string;
}

interface ProcessoData {
  numeroProcesso: string;
  tribunal: string;
  dataDistribuicao: string;
  vara: string;
  assunto: string;
  status: string;
  partes: Partes;
  movimentacoes: Movimentacao[];
}

interface ProcessoNaoEncontrado {
  status: "nao_encontrado";
  mensagem: string;
}

interface ResultadoProcessoProps {
  isLoading?: boolean;
  erro?: string;
  resultado?: ProcessoData | ProcessoNaoEncontrado;
}

const ResultadoProcesso: React.FC<ResultadoProcessoProps> = ({
  isLoading = false,
  erro,
  resultado = {
    numeroProcesso: "00277463920218272729",
    tribunal: "Tribunal de Justiça do Tocantins - TO",
    vara: "2ª Vara Cível de Palmas",
    assunto: "Direito Civil - Obrigações - Contratos",
    dataDistribuicao: "15/03/2021",
    status: "Em andamento",
    partes: {
      requerente: "João da Silva",
      requerido: "Empresa XYZ Ltda",
    },
    movimentacoes: [
      { data: "20/05/2022", descricao: "Sentença proferida" },
      { data: "10/04/2022", descricao: "Audiência realizada" },
      { data: "15/03/2021", descricao: "Processo distribuído" },
    ],
  },
}) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-background">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-background">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro na consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{erro}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se o processo não foi encontrado
  if (
    resultado &&
    "status" in resultado &&
    resultado.status === "nao_encontrado"
  ) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-background">
        <Alert variant="destructive">
          <AlertDescription>
            ❌{" "}
            {resultado.mensagem ||
              "Processo não encontrado no tribunal informado."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Garantir que temos dados válidos do processo
  const dados = resultado as ProcessoData;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-background">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <CardTitle>Processo {dados.numeroProcesso}</CardTitle>
            <Badge
              variant={
                dados.status === "Arquivado" || dados.status === "Concluído"
                  ? "secondary"
                  : "default"
              }
              className="self-start md:self-auto"
            >
              {dados.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">{dados.tribunal}</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Dados do Processo */}
            <div>
              <h3 className="text-lg font-medium mb-3">📄 Dados do Processo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Vara</p>
                  <p className="text-sm">{dados.vara}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data de Distribuição</p>
                  <p className="text-sm">{dados.dataDistribuicao}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium">Assunto</p>
                  <p className="text-sm">{dados.assunto}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Partes do processo */}
            <div>
              <h3 className="text-lg font-medium mb-3">
                👥 Partes do Processo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">Requerente</p>
                  <p className="text-sm">{dados.partes.requerente}</p>
                </div>
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">Requerido</p>
                  <p className="text-sm">{dados.partes.requerido}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Movimentações */}
            <div>
              <h3 className="text-lg font-medium mb-3">🕓 Movimentações</h3>
              <div className="space-y-3">
                {dados.movimentacoes.map((mov, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-3 rounded-md bg-muted"
                  >
                    <div className="min-w-24 text-sm font-medium">
                      {mov.data}
                    </div>
                    <div className="text-sm">{mov.descricao}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadoProcesso;
