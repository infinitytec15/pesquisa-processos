import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Search,
  Sparkles,
  BookOpen,
  Scale,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";

interface JurisprudenciaFormData {
  tema: string;
  palavrasChave: string[];
  page: number;
  pageSize: number;
}

interface JurisprudenciaItem {
  idDocumento: string;
  titulo: string;
  ministro: string;
  orgao_julgador: string;
  ementa: string;
  julgamento_data: string;
  publicacao_data?: string;
  inteiro_teor_url: string;
}

interface WebhookResponse {
  total: number;
  page: number;
  pageSize: number;
  data: JurisprudenciaItem[];
  resumoIA?: string;
}

interface SecaoAnalise {
  emoji: string;
  titulo: string;
  conteudo: string;
}

const palavrasChaveSugeridas = [
  "dano moral",
  "indenização",
  "responsabilidade civil",
  "contrato",
  "consumidor",
  "trabalhista",
  "família",
  "sucessões",
  "propriedade",
  "execução",
];

export default function Jurisprudencia() {
  const [formData, setFormData] = useState<JurisprudenciaFormData>({
    tema: "",
    palavrasChave: [],
    page: 1,
    pageSize: 10,
  });
  const [palavraChaveInput, setPalavraChaveInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [secoesAnalise, setSecoesAnalise] = useState<SecaoAnalise[]>([]);
  const [jurisprudenciaData, setJurisprudenciaData] =
    useState<WebhookResponse | null>(null);
  const { toast } = useToast();

  const parseAnaliseIA = (texto: string): SecaoAnalise[] => {
    const secoes: SecaoAnalise[] = [];
    const emojiTitulos = {
      "📌": "Resumo Geral",
      "🧑‍⚖️": "Decisão",
      "📄": "Contexto do Caso",
      "⚖️": "Fundamentação",
      "📚": "Consequência Jurídica",
      "🔍": "Observações Finais",
    };

    // Normalizar o texto removendo caracteres especiais invisíveis
    const textoLimpo = texto.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

    // Regex mais específica para capturar emojis seguidos de **Título**
    const regex =
      /(📌\*\*[^*]+\*\*|🧑‍⚖️\*\*[^*]+\*\*|📄\*\*[^*]+\*\*|⚖️\*\*[^*]+\*\*|📚\*\*[^*]+\*\*|🔍\*\*[^*]+\*\*)/g;

    const matches = textoLimpo.match(regex);

    if (!matches || matches.length === 0) {
      // Fallback: tentar regex simples por emoji
      const regexSimples = /(📌|🧑‍⚖️|📄|⚖️|📚|🔍)/g;
      const partesSimples = textoLimpo
        .split(regexSimples)
        .filter((parte) => parte.trim() !== "");

      if (partesSimples.length <= 1) {
        secoes.push({
          emoji: "📋",
          titulo: "Análise Completa",
          conteudo: textoLimpo,
        });
        return secoes;
      }

      for (let i = 0; i < partesSimples.length; i += 2) {
        const emoji = partesSimples[i] as keyof typeof emojiTitulos;
        const conteudo = partesSimples[i + 1];

        if (emoji && conteudo && emojiTitulos[emoji]) {
          secoes.push({
            emoji,
            titulo: emojiTitulos[emoji],
            conteudo: conteudo.trim(),
          });
        }
      }
      return secoes;
    }

    // Processar matches encontrados
    let ultimoIndice = 0;

    matches.forEach((match, index) => {
      const emojiMatch = match.match(/(📌|🧑‍⚖️|📄|⚖️|📚|🔍)/);
      if (!emojiMatch) return;

      const emoji = emojiMatch[0] as keyof typeof emojiTitulos;
      const indiceMatch = textoLimpo.indexOf(match, ultimoIndice);

      // Encontrar o conteúdo até o próximo emoji ou fim do texto
      let proximoIndice = textoLimpo.length;
      if (index < matches.length - 1) {
        const proximoMatch = matches[index + 1];
        proximoIndice = textoLimpo.indexOf(
          proximoMatch,
          indiceMatch + match.length,
        );
      }

      const conteudoCompleto = textoLimpo
        .substring(indiceMatch + match.length, proximoIndice)
        .trim();

      if (emojiTitulos[emoji] && conteudoCompleto) {
        secoes.push({
          emoji,
          titulo: emojiTitulos[emoji],
          conteudo: conteudoCompleto,
        });
      }

      ultimoIndice = proximoIndice;
    });

    return secoes.length > 0
      ? secoes
      : [
          {
            emoji: "📋",
            titulo: "Análise Completa",
            conteudo: textoLimpo,
          },
        ];
  };

  const handleAddPalavraChave = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && palavraChaveInput.trim()) {
      e.preventDefault();
      if (!formData.palavrasChave.includes(palavraChaveInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          palavrasChave: [...prev.palavrasChave, palavraChaveInput.trim()],
        }));
      }
      setPalavraChaveInput("");
    }
  };

  const handleAddPalavraSugerida = (palavra: string) => {
    if (!formData.palavrasChave.includes(palavra)) {
      setFormData((prev) => ({
        ...prev,
        palavrasChave: [...prev.palavrasChave, palavra],
      }));
    }
  };

  const removePalavraChave = (palavra: string) => {
    setFormData((prev) => ({
      ...prev,
      palavrasChave: prev.palavrasChave.filter((p) => p !== palavra),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tema.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o tema da consulta.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResultado(null);
    setSecoesAnalise([]);

    const webhookUrl =
      "https://webhook.trocaze.com.br/webhook/98b33bb0-3564-4cac-b59b-6530707f4281";
    const requestData = {
      tema: formData.tema,
      palavrasChave: formData.palavrasChave,
      page: formData.page,
      pageSize: formData.pageSize,
    };

    console.log("Enviando dados para webhook:", {
      url: webhookUrl,
      data: requestData,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      const response = await fetch(webhookUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;

        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          console.error("Erro ao ler resposta de erro:", textError);
        }

        throw new Error(errorMessage);
      }

      let data: WebhookResponse;
      const responseText = await response.text();

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // Se não conseguir parsear como JSON, usar como texto simples
          data = { resumoIA: responseText };
        }
      } else {
        throw new Error("Resposta vazia do servidor");
      }

      // Processar a resposta
      let processedData: WebhookResponse;

      // Verificar se os dados estão dentro de resumoIA como JSON string
      if (data && data.resumoIA) {
        try {
          // Verificar se resumoIA começa com "={" (indicando JSON)
          let jsonString = data.resumoIA;
          if (jsonString.startsWith("={")) {
            jsonString = jsonString.substring(1); // Remove o "=" inicial
          }

          // Tentar parsear resumoIA como JSON
          const parsedResumoIA = JSON.parse(jsonString);

          // Se for um objeto com as propriedades esperadas, usar como dados principais
          if (
            parsedResumoIA &&
            typeof parsedResumoIA === "object" &&
            parsedResumoIA.data
          ) {
            processedData = {
              total: parsedResumoIA.total || 0,
              page: parsedResumoIA.page || 1,
              pageSize: parsedResumoIA.pageSize || 10,
              data: parsedResumoIA.data || [],
              resumoIA: undefined, // Não mostrar como texto já que temos dados estruturados
            };
          } else {
            // Se não for dados estruturados, tratar como análise textual
            processedData = data;
            const textoAnalise = data.resumoIA;
            setResultado(textoAnalise);
            const secoesParsed = parseAnaliseIA(textoAnalise);
            setSecoesAnalise(secoesParsed);
          }
        } catch (parseError) {
          // Se não conseguir parsear, tratar como análise textual
          console.log("Tratando resumoIA como texto:", parseError);
          processedData = data;
          const textoAnalise = data.resumoIA;
          setResultado(textoAnalise);
          const secoesParsed = parseAnaliseIA(textoAnalise);
          setSecoesAnalise(secoesParsed);
        }
      } else {
        // Usar dados como estão
        processedData = data;
      }

      setJurisprudenciaData(processedData);

      toast({
        title: "Sucesso!",
        description: "Análise jurídica concluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro na consulta:", error);

      let errorMessage = "Erro desconhecido";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage =
            "Tempo limite da requisição excedido. Tente novamente.";
        } else if (error.message.includes("fetch")) {
          errorMessage =
            "Erro de conexão. Verifique sua internet e tente novamente.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erro na Consulta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNovaConsulta = () => {
    setFormData({ tema: "", palavrasChave: [], page: 1, pageSize: 10 });
    setPalavraChaveInput("");
    setResultado(null);
    setSecoesAnalise([]);
    setJurisprudenciaData(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
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
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Sistema Jurídico IA
                  </h1>
                  <p className="text-sm text-gray-600">
                    Análise Inteligente de Jurisprudência
                  </p>
                </div>
              </div>
            </div>
            <nav className="flex space-x-6">
              <a
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
              >
                <BookOpen className="h-4 w-4" />
                <span>Início</span>
              </a>
              <a
                href="/jurisprudencia"
                className="flex items-center space-x-2 text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded-full border border-blue-200"
              >
                <Sparkles className="h-4 w-4" />
                <span>Jurisprudência IA</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 mt-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-4">
              Jurisprudência com IA
            </h1>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              Descubra jurisprudências relevantes com análise inteligente e
              insights jurídicos avançados
            </p>
            <div className="flex items-center justify-center space-x-6 mt-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Search className="h-4 w-4 mr-2" />
                Busca Inteligente
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <FileText className="h-4 w-4 mr-2" />
                Análise Estruturada
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualização Clara
              </Badge>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
              <CardTitle className="text-3xl font-bold flex items-center space-x-3">
                <Search className="h-8 w-8" />
                <span>Consulta Jurisprudencial</span>
              </CardTitle>
              <p className="text-blue-100 text-lg mt-2">
                Preencha os campos abaixo para iniciar sua pesquisa inteligente
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <Label
                    htmlFor="tema"
                    className="text-xl font-bold text-gray-800 flex items-center space-x-2"
                  >
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Tema da Consulta</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="tema"
                      type="text"
                      placeholder="Ex: dano moral por negativação indevida, responsabilidade civil médica..."
                      value={formData.tema}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tema: e.target.value,
                        }))
                      }
                      className="h-14 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 pl-12 bg-gray-50 focus:bg-white transition-all duration-200"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 ml-1">
                    Descreva o tema jurídico que você deseja pesquisar
                  </p>
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="palavrasChave"
                    className="text-xl font-bold text-gray-800 flex items-center space-x-2"
                  >
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Palavras-chave</span>
                  </Label>

                  {/* Palavras-chave sugeridas */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                    <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>
                        Sugestões Inteligentes (clique para adicionar):
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {palavrasChaveSugeridas.map((palavra, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPalavraSugerida(palavra)}
                          className={cn(
                            "text-sm rounded-full transition-all duration-200 border-2 font-medium",
                            formData.palavrasChave.includes(palavra)
                              ? "bg-blue-600 text-white border-blue-600 cursor-not-allowed shadow-md"
                              : "hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md hover:scale-105",
                          )}
                          disabled={formData.palavrasChave.includes(palavra)}
                        >
                          {palavra}
                          {formData.palavrasChave.includes(palavra) && " ✓"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      id="palavrasChave"
                      type="text"
                      placeholder="Digite uma palavra-chave personalizada e pressione Enter"
                      value={palavraChaveInput}
                      onChange={(e) => setPalavraChaveInput(e.target.value)}
                      onKeyDown={handleAddPalavraChave}
                      className="h-14 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 pl-12 bg-gray-50 focus:bg-white transition-all duration-200"
                    />
                    <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {formData.palavrasChave.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border-2 border-blue-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Palavras-chave selecionadas (
                        {formData.palavrasChave.length}):
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {formData.palavrasChave.map((palavra, index) => (
                          <Badge
                            key={index}
                            variant="default"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            {palavra}
                            <button
                              type="button"
                              onClick={() => removePalavraChave(palavra)}
                              className="ml-1 text-white hover:text-red-200 hover:scale-110 transition-all duration-200"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span>Analisando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
                      <span>Gerar Jurisprudência</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {isLoading && (
            <Card className="mt-12 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl animate-pulse">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-3xl">
                <CardTitle className="text-3xl font-bold flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                  <span>IA Analisando Jurisprudências...</span>
                </CardTitle>
                <p className="text-blue-100 text-lg">
                  Nossa inteligência artificial está processando sua consulta
                </p>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full rounded-xl" />
                  <Skeleton className="h-6 w-4/5 rounded-xl" />
                  <Skeleton className="h-6 w-3/5 rounded-xl" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full rounded-xl" />
                  <Skeleton className="h-6 w-2/3 rounded-xl" />
                </div>
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-lg font-semibold">
                    Processando dados jurídicos...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {jurisprudenciaData && (
            <div className="mt-12 space-y-8">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                    <Scale className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
                  Análise Completa de Jurisprudência
                </h2>
                <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                  Resultados encontrados com base na sua consulta
                </p>
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm border-green-200 text-green-700"
                  >
                    📊 Total: {jurisprudenciaData.total} itens
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm border-blue-200 text-blue-700"
                  >
                    📄 Página: {jurisprudenciaData.page} de{" "}
                    {Math.ceil(
                      jurisprudenciaData.total / jurisprudenciaData.pageSize,
                    )}
                  </Badge>
                </div>
              </div>

              {jurisprudenciaData.data && jurisprudenciaData.data.length > 0 ? (
                <div className="grid gap-6">
                  {jurisprudenciaData.data.map((item) => (
                    <Card
                      key={item.idDocumento}
                      className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-3xl transform transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] animate-fade-in overflow-hidden"
                    >
                      <CardContent className="p-8">
                        <div className="space-y-6">
                          {/* Título do documento */}
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl mt-1">📌</span>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-800 leading-tight">
                                {item.titulo}
                              </h3>
                            </div>
                          </div>

                          {/* Ministro */}
                          <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-2xl">
                            <span className="text-2xl">👩‍⚖️</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">
                                Ministro
                              </p>
                              <p className="font-bold text-gray-800">
                                {item.ministro || "Não informado"}
                              </p>
                            </div>
                          </div>

                          {/* Órgão Julgador */}
                          <div className="flex items-center space-x-3 bg-purple-50 p-4 rounded-2xl">
                            <span className="text-2xl">🏛️</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">
                                Órgão Julgador
                              </p>
                              <p className="font-bold text-gray-800">
                                {item.orgao_julgador || "Não informado"}
                              </p>
                            </div>
                          </div>

                          {/* Data do julgamento */}
                          <div className="flex items-center space-x-3 bg-green-50 p-4 rounded-2xl">
                            <span className="text-2xl">📅</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">
                                Julgamento
                              </p>
                              <p className="font-bold text-gray-800">
                                {item.julgamento_data}
                              </p>
                            </div>
                          </div>

                          {/* Ementa completa */}
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                              <span className="text-xl">📢</span>
                              <span>Ementa</span>
                            </h4>
                            <div className="text-gray-700 leading-relaxed">
                              <p className="whitespace-pre-wrap">
                                {item.ementa || "Ementa indisponível"}
                              </p>
                            </div>
                          </div>

                          {/* Botão Ver Inteiro Teor */}
                          <div className="flex justify-center pt-4">
                            <a
                              href={item.inteiro_teor_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              <span className="text-lg">🔗</span>
                              <span>Ver Inteiro Teor</span>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-3xl overflow-hidden">
                  <CardContent className="p-12 text-center">
                    <div className="space-y-6">
                      <div className="text-6xl mb-4">❌</div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        Nenhuma jurisprudência encontrada com os critérios
                        informados
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Tente ajustar os termos da consulta ou as palavras-chave
                        para obter resultados.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Consulta Concluída com Sucesso! 🎉
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Sua pesquisa jurisprudencial foi processada com sucesso
                  </p>
                  <Button
                    onClick={handleNovaConsulta}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 mx-auto"
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Fazer Nova Consulta</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {secoesAnalise.length > 0 && (
            <div className="mt-12 space-y-8">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                    <FileText className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
                  Análise Jurídica Completa
                </h2>
                <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                  Resultado estruturado e organizado pela nossa IA especializada
                </p>
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm border-green-200 text-green-700"
                  >
                    ✅ Análise Concluída
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm border-blue-200 text-blue-700"
                  >
                    📊 {secoesAnalise.length} Seções
                  </Badge>
                </div>
              </div>

              {secoesAnalise.map((secao, index) => {
                const gradientColors = {
                  "📌": "from-blue-500 to-indigo-600",
                  "🧑‍⚖️": "from-purple-500 to-violet-600",
                  "📄": "from-green-500 to-emerald-600",
                  "⚖️": "from-orange-500 to-red-600",
                  "📚": "from-teal-500 to-cyan-600",
                  "🔍": "from-pink-500 to-rose-600",
                  "📋": "from-gray-500 to-slate-600",
                };
                const gradient =
                  gradientColors[secao.emoji as keyof typeof gradientColors] ||
                  "from-blue-500 to-indigo-600";

                return (
                  <Card
                    key={index}
                    className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] animate-fade-in overflow-hidden"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <CardHeader
                      className={`bg-gradient-to-r ${gradient} text-white rounded-t-3xl pb-6`}
                    >
                      <CardTitle className="text-2xl font-bold flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                          <span className="text-3xl">{secao.emoji}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{secao.titulo}</h3>
                          <p className="text-white/80 text-sm font-normal mt-1">
                            Seção {index + 1} de {secoesAnalise.length}
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="prose prose-xl max-w-none">
                        <div className="whitespace-pre-line text-gray-800 leading-relaxed text-lg font-medium">
                          {secao.conteudo}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Análise Concluída com Sucesso! 🎉
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    Sua consulta jurisprudencial foi processada pela nossa IA
                    especializada
                  </p>
                  <Button
                    onClick={handleNovaConsulta}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 mx-auto"
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Fazer Nova Consulta</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {resultado && secoesAnalise.length === 0 && (
            <Card className="mt-12 bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl animate-fade-in overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-3xl pb-6">
                <CardTitle className="text-3xl font-bold flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">
                      Resultado da Análise IA
                    </h3>
                    <p className="text-blue-100 text-lg font-normal mt-1">
                      Análise jurisprudencial completa
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="prose prose-xl max-w-none">
                  <div className="whitespace-pre-line text-gray-800 leading-relaxed text-lg font-medium bg-gray-50 p-8 rounded-2xl border border-gray-200">
                    {resultado}
                  </div>
                </div>
                <div className="mt-10 text-center">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                    <Button
                      onClick={handleNovaConsulta}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3 mx-auto"
                    >
                      <RefreshCw className="h-6 w-6" />
                      <span>Fazer Nova Consulta</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
