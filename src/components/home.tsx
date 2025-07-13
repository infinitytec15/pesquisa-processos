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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-xl border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9m3 9l3-9"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Sistema Jurídico IA
                  </h1>
                  <p className="text-sm text-gray-600">
                    Consulta de Processos Judiciais
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex space-x-6">
              <a
                href="/"
                className="flex items-center space-x-2 text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded-full border border-blue-200"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span>Consulta</span>
              </a>
              <a
                href="/jurisprudencia"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <span>Jurisprudência IA</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 flex flex-col items-center">
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
              <ConsultaProcesso
                onSubmit={handleConsulta}
                isLoading={isLoading}
              />

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
              <p>
                © {new Date().getFullYear()} Sistema de Consulta Processual
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
