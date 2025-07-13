import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import ResultadoProcesso from "./ResultadoProcesso";

const WEBHOOK_URL =
  "https://n8n.trocaze.com.br/webhook-test/21ea845a-5ef0-412f-8286-d45ad5550480";

const estadosBrasileiros = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

const formSchema = z.object({
  numeroProcesso: z
    .string()
    .min(1, { message: "Número do processo é obrigatório" })
    .regex(/^\d+$/, {
      message: "O número do processo deve conter apenas dígitos",
    })
    .min(20, {
      message: "O número do processo deve ter pelo menos 20 dígitos",
    }),
  estado: z.string().min(1, { message: "Selecione um estado" }),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsultaProcessoProps {
  className?: string;
}

const ConsultaProcesso: React.FC<ConsultaProcessoProps> = ({
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroProcesso: "",
      estado: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numeroProcesso: values.numeroProcesso,
          estado: values.estado,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na consulta: ${response.status}`);
      }

      const data = await response.json();
      setResultado(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao consultar o processo",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTentarNovamente = () => {
    setError(null);
    form.handleSubmit(onSubmit)();
  };

  const handleNovaPesquisa = () => {
    setResultado(null);
    setError(null);
    form.reset();
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Consulta de Processos Judiciais
          </CardTitle>
          <CardDescription className="text-center">
            Informe o número do processo e o estado para realizar a consulta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resultado ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="numeroProcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Processo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o número do processo (apenas números)"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estadosBrasileiros.map((estado) => (
                            <SelectItem key={estado.sigla} value={estado.sigla}>
                              {estado.sigla}: {estado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    "Pesquisar"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <ResultadoProcesso resultado={resultado} />
          )}
        </CardContent>
        {resultado && (
          <CardFooter className="flex justify-center">
            <Button onClick={handleNovaPesquisa}>Nova Consulta</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ConsultaProcesso;
