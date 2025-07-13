import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
  resultado,
}) => {
  const [resumoIA, setResumoIA] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const { toast } = useToast();
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

  // Se não há resultado, não renderizar nada
  if (!resultado) {
    return null;
  }

  // Garantir que temos dados válidos do processo
  const dados = resultado as ProcessoData;

  // Expandir sigla do tribunal se necessário
  const tribunalCompleto =
    dados.tribunal === "TJTO"
      ? "Tribunal de Justiça do Tocantins - TO"
      : dados.tribunal;

  const gerarResumoIA = async () => {
    setCarregandoResumo(true);
    try {
      const response = await fetch(
        "https://webhook.trocaze.com.br/webhook/a5703cd8-d4cd-4b83-a122-b229ddf5237b",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numeroProcesso: dados.numeroProcesso,
            tribunal: dados.tribunal,
            status: dados.status,
            classe: dados.assunto, // Usando assunto como classe
            assunto: dados.assunto,
            movimentacoes: dados.movimentacoes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro na requisição");
      }

      const data = await response.json();
      setResumoIA(data.resumo);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "⚠️ Ocorreu um erro ao gerar o resumo com IA. Tente novamente mais tarde.",
      });
    } finally {
      setCarregandoResumo(false);
    }
  };

  const formatarResumoIA = (texto: string) => {
    return texto
      .split("\n")
      .map((linha, index) => {
        // Títulos principais com ### (Markdown)
        if (linha.match(/^###\s+/)) {
          const textoLimpo = linha.replace(/^###\s+/, "");
          return (
            <h3
              key={index}
              className="font-bold text-xl mt-8 mb-4 text-blue-700 border-b border-blue-200 pb-2"
            >
              {textoLimpo}
            </h3>
          );
        }

        // Títulos secundários com ## (Markdown)
        if (linha.match(/^##\s+/)) {
          const textoLimpo = linha.replace(/^##\s+/, "");
          return (
            <h4
              key={index}
              className="font-bold text-lg mt-6 mb-3 text-blue-600"
            >
              {textoLimpo}
            </h4>
          );
        }

        // Texto em negrito (**texto**)
        if (linha.includes("**")) {
          const textoFormatado = linha.replace(
            /\*\*([^*]+)\*\*/g,
            "<strong class='font-semibold text-blue-800'>$1</strong>",
          );
          return (
            <p
              key={index}
              className="mb-3 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: textoFormatado }}
            />
          );
        }

        // Listas com bullet points (•)
        if (linha.match(/^\s*•\s/)) {
          return (
            <div key={index} className="flex items-start gap-3 mb-3 ml-4">
              <span className="text-blue-600 font-bold mt-1 text-lg">•</span>
              <span className="text-sm leading-relaxed">
                {linha.replace(/^\s*•\s/, "")}
              </span>
            </div>
          );
        }

        // Listas com traço (-)
        if (linha.match(/^\s*-\s/)) {
          return (
            <div key={index} className="flex items-start gap-3 mb-3 ml-6">
              <span className="text-blue-500 font-bold mt-1">-</span>
              <span className="text-sm leading-relaxed">
                {linha.replace(/^\s*-\s/, "")}
              </span>
            </div>
          );
        }

        // Texto normal
        return linha.trim() ? (
          <p key={index} className="mb-4 text-sm leading-relaxed text-gray-700">
            {linha}
          </p>
        ) : (
          <div key={index} className="mb-3" />
        );
      })
      .filter(Boolean);
  };

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
          <div className="text-sm text-muted-foreground">
            {tribunalCompleto}
          </div>
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
                {dados.movimentacoes && dados.movimentacoes.length > 0 ? (
                  dados.movimentacoes.map((mov, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-3 rounded-md bg-muted"
                    >
                      <div className="min-w-24 text-sm font-medium">
                        {mov.data}
                      </div>
                      <div className="text-sm">{mov.descricao}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma movimentação encontrada.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Resumo com IA */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Button
                  onClick={gerarResumoIA}
                  disabled={carregandoResumo}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  {carregandoResumo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando resumo...
                    </>
                  ) : (
                    <>🧠 Resumo com IA</>
                  )}
                </Button>
              </div>

              {/* Loading skeleton enquanto carrega */}
              {carregandoResumo && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      🧠 Resumo com IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="space-y-2 mt-4">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card com o resumo da IA */}
              {resumoIA && !carregandoResumo && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      🧠 Resumo com IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-gray-700 leading-relaxed">
                      {formatarResumoIA(resumoIA)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadoProcesso;
