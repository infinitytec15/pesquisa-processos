import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConsultaProcesso from "./ConsultaProcesso";
import ResultadoProcesso from "./ResultadoProcesso";

interface ProcessoData {
  numeroProcesso: string;
  estado: string;
}

interface ResultadoProcesso {
  numeroProcesso: string;
  estado: string;
  status: string;
  dataDistribuicao?: string;
  vara?: string;
  partes?: {
    autor?: string;
    reu?: string;
  };
  movimentacoes?: Array<{
    data: string;
    descricao: string;
  }>;
  // Outros campos que possam vir na resposta
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProcesso | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConsulta = async (data: ProcessoData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://n8n.trocaze.com.br/webhook-test/21ea845a-5ef0-412f-8286-d45ad5550480",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numeroProcesso: data.numeroProcesso,
            estado: data.estado,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Erro na consulta: ${response.status}`);
      }

      const responseData = await response.json();
      setResultado(responseData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao consultar o processo",
      );
      setResultado(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <Card className="w-full bg-white shadow-md">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-2xl font-bold">
              Consulta de Processos Judiciais
            </CardTitle>
            <CardDescription className="text-blue-100">
              Consulte informações de processos judiciais por número e estado
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <ConsultaProcesso onSubmit={handleConsulta} isLoading={isLoading} />

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                <p className="font-medium">Erro na consulta</p>
                <p>{error}</p>
              </div>
            )}

            {resultado && !error && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Resultado da Consulta
                </h2>
                <ResultadoProcesso resultado={resultado} />
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-gray-50 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Sistema de Consulta Processual</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
