import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button, Input, Select, Card, EmptyState } from "./index";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("applies primary variant styles by default", () => {
    render(<Button>Primario</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-gray-900");
    expect(button.className).toContain("text-white");
  });

  it("applies secondary variant styles", () => {
    render(<Button variant="secondary">Secundario</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-gray-300");
    expect(button.className).toContain("text-gray-700");
  });

  it("applies danger variant styles", () => {
    render(<Button variant="danger">Eliminar</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-red-600");
    expect(button.className).toContain("text-white");
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<Button size="sm">Pequeño</Button>);
    expect(screen.getByRole("button").className).toContain("h-9");

    rerender(<Button size="md">Mediano</Button>);
    expect(screen.getByRole("button").className).toContain("h-11");

    rerender(<Button size="lg">Grande</Button>);
    expect(screen.getByRole("button").className).toContain("h-12");
  });

  it("supports disabled state", () => {
    render(<Button disabled>Deshabilitado</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has focus-visible ring for keyboard navigation", () => {
    render(<Button>Foco</Button>);
    expect(screen.getByRole("button").className).toContain("focus-visible:ring-2");
  });
});

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Nombre" />);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("shows error message when error prop is set", () => {
    render(<Input label="Email" error="Campo requerido" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Campo requerido");
  });

  it("applies error styling when error is present", () => {
    render(<Input label="Email" error="Inválido" />);
    const input = screen.getByLabelText("Email");
    expect(input.className).toContain("border-red-300");
  });

  it("shows helper text when no error", () => {
    render(<Input label="Teléfono" helperText="7 a 15 dígitos" />);
    expect(screen.getByText("7 a 15 dígitos")).toBeInTheDocument();
  });

  it("hides helper text when error is present", () => {
    render(
      <Input label="Teléfono" helperText="7 a 15 dígitos" error="Inválido" />
    );
    expect(screen.queryByText("7 a 15 dígitos")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Inválido");
  });

  it("sets aria-invalid when error exists", () => {
    render(<Input label="Nombre" error="Error" />);
    expect(screen.getByLabelText("Nombre")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("links error message via aria-describedby", () => {
    render(<Input label="Nombre" error="Campo requerido" />);
    const input = screen.getByLabelText("Nombre");
    const errorEl = screen.getByRole("alert");
    expect(input.getAttribute("aria-describedby")).toBe(errorEl.id);
  });
});

describe("Select", () => {
  const options = [
    { value: "stand", label: "Stand" },
    { value: "patrocinador", label: "Patrocinador" },
  ];

  it("renders with label and options", () => {
    render(<Select label="Modalidad" options={options} />);
    expect(screen.getByLabelText("Modalidad")).toBeInTheDocument();
    expect(screen.getByText("Stand")).toBeInTheDocument();
    expect(screen.getByText("Patrocinador")).toBeInTheDocument();
  });

  it("renders placeholder option when provided", () => {
    render(
      <Select
        label="Modalidad"
        options={options}
        placeholder="Seleccionar..."
      />
    );
    expect(screen.getByText("Seleccionar...")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(
      <Select label="Modalidad" options={options} error="Seleccione una opción" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Seleccione una opción"
    );
  });

  it("sets aria-invalid when error exists", () => {
    render(<Select label="Modalidad" options={options} error="Error" />);
    expect(screen.getByLabelText("Modalidad")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});

describe("Card", () => {
  it("renders children content", () => {
    render(<Card>Contenido</Card>);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<Card title="Mi Tarjeta">Contenido</Card>);
    expect(screen.getByText("Mi Tarjeta")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <Card title="Título" description="Descripción de la tarjeta">
        Contenido
      </Card>
    );
    expect(screen.getByText("Descripción de la tarjeta")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Card className="custom-class">Contenido</Card>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has rounded border and shadow styles", () => {
    const { container } = render(<Card>Contenido</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-lg");
    expect(card.className).toContain("border-gray-200");
    expect(card.className).toContain("shadow-sm");
  });
});

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState message="No hay empresas para mostrar" />);
    expect(
      screen.getByText("No hay empresas para mostrar")
    ).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <EmptyState title="Sin datos" message="No hay empresas para mostrar" />
    );
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  it("renders action link when provided", () => {
    render(
      <EmptyState
        message="No hay empresas"
        action={{ label: "Registrar empresa", href: "/empresas/nueva" }}
      />
    );
    const link = screen.getByRole("link", { name: "Registrar empresa" });
    expect(link).toHaveAttribute("href", "/empresas/nueva");
  });

  it("does not render action when not provided", () => {
    render(<EmptyState message="Sin datos" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
