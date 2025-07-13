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
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ResultadoProcesso from "./ResultadoProcesso";

const WEBHOOK_URL =
  "https://webhook.trocaze.com.br/webhook/21ea845a-5ef0-412f-8286-d45ad5550480";

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
    .regex(/^\d{20}$/, {
      message:
        "⚠️ O número do processo deve conter apenas números e ter exatamente 20 dígitos.",
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
  const [resultado, setResultado] = useState<any>(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState("");
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroProcesso: "",
      estado: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
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

      // Verificar se a resposta é um array e pegar o primeiro item
      let processData = data;
      if (Array.isArray(data) && data.length > 0) {
        processData = data[0];
      }

      // Verificar se o processo não foi encontrado
      if (processData && processData.status === "nao_encontrado") {
        setNotFoundMessage(
          processData.mensagem ||
            "Processo não encontrado no tribunal informado.",
        );
        setShowNotFoundModal(true);
        return;
      }

      // Verificar se a resposta contém apenas uma mensagem de erro
      if (
        processData &&
        processData.mensagem &&
        processData.mensagem.includes("❌ Processo não encontrado")
      ) {
        setNotFoundMessage(processData.mensagem);
        setShowNotFoundModal(true);
        return;
      }

      // Limpar espaços em branco do número do processo se existir
      if (processData && processData.numeroProcesso) {
        processData.numeroProcesso = processData.numeroProcesso.trim();
      }

      // Se chegou aqui, é um sucesso - mostrar resultado
      setResultado(processData);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description:
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao consultar o processo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNovaPesquisa = () => {
    setResultado(null);
    form.reset();
  };

  const handleCloseNotFoundModal = () => {
    setShowNotFoundModal(false);
    setNotFoundMessage("");
  };

  return (
    <>
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
                              <SelectItem
                                key={estado.sigla}
                                value={estado.sigla}
                              >
                                {estado.sigla}: {estado.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

      <AlertDialog open={showNotFoundModal} onOpenChange={setShowNotFoundModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Processo não encontrado</AlertDialogTitle>
            <AlertDialogDescription>{notFoundMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseNotFoundModal}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConsultaProcesso;
