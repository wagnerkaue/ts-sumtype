// Prints an arrow function whose body is `r(callback)` with `r(... =>` on the arrow's line and the
// callback's body one level deep. A line that's too long breaks the arrow's own signature, or moves
// a one-expression body to the next line.
import { doc, type AstPath, type Doc, type ParserOptions, type Printer } from "prettier";
import { printers as estreePrinters } from "prettier/plugins/estree";

/** The fields of the syntax tree's nodes this plugin reads. */
type Node = {
  readonly type: string;
  readonly name?: string;
  readonly async?: boolean;
  readonly optional?: boolean;
  readonly comments?: readonly unknown[];
  readonly typeAnnotation?: unknown;
  readonly typeParameters?: unknown;
  readonly typeArguments?: unknown;
  readonly returnType?: unknown;
  readonly callee?: Node;
  readonly arguments?: readonly Node[];
  readonly params?: readonly Node[];
  readonly body?: Node;
};

type Print = Parameters<Printer["print"]>[2];

const base = estreePrinters.estree;
const { group, ifBreak, indent, join, line, softline } = doc.builders;
const { removeLines } = doc.utils;

const hasComments = (node: Node): boolean => (node.comments ?? []).length > 0;

const isPlainArrow = (node: Node): boolean =>
  node.type === "ArrowFunctionExpression" && node.async !== true && !hasComments(node);

const isPlainCallback = (node: Node): boolean =>
  isPlainArrow(node) && node.typeParameters == null && node.returnType == null;

const isRCall = (node: Node): boolean =>
  node.type === "CallExpression" &&
  !hasComments(node) &&
  node.callee?.type === "Identifier" &&
  node.callee.name === "r" &&
  node.typeArguments == null &&
  node.arguments?.length === 1 &&
  isPlainCallback(node.arguments[0]);

const isArrowIntoR = (node: Node): boolean =>
  isPlainArrow(node) && node.returnType != null && node.body !== undefined && isRCall(node.body);

const isSoleObjectPattern = (params: readonly Node[]): boolean =>
  params.length === 1 && params[0].type === "ObjectPattern";

const printParameters = (path: AstPath, options: ParserOptions, print: Print): Doc =>
  isSoleObjectPattern(path.node.params)
    ? print(["params", 0])
    : [
        indent([softline, join([",", line], path.map(print, "params"))]),
        options.trailingComma === "none" ? "" : ifBreak(","),
        softline,
      ];

const printSignature = (path: AstPath, options: ParserOptions, print: Print): Doc =>
  group([
    path.node.typeParameters == null ? "" : print("typeParameters"),
    "(",
    printParameters(path, options, print),
    "): ",
    print(["returnType", "typeAnnotation"]),
  ]);

const canOmitParentheses = (params: readonly Node[], options: ParserOptions): boolean =>
  options.arrowParens === "avoid" &&
  params.length === 1 &&
  params[0].type === "Identifier" &&
  params[0].typeAnnotation == null &&
  params[0].optional !== true &&
  !hasComments(params[0]);

const printCallbackParameters = (path: AstPath, options: ParserOptions, print: Print): Doc => {
  const callback: Node = path.node.body.arguments[0];
  const params = join(", ", path.map(() => removeLines(print()), "body", "arguments", 0, "params"));
  return canOmitParentheses(callback.params ?? [], options) ? params : ["(", params, ")"];
};

const printCallbackBody = (path: AstPath, print: Print): Doc => {
  const body = print(["body", "arguments", 0, "body"]);
  return path.node.body.arguments[0].body.type === "BlockStatement" ? [" ", body] : group(indent([line, body]));
};

const printArrowIntoR = (path: AstPath, options: ParserOptions, print: Print): Doc =>
  group([
    printSignature(path, options, print),
    " => ",
    print(["body", "callee"]),
    "(",
    printCallbackParameters(path, options, print),
    " =>",
    printCallbackBody(path, print),
    ")",
  ]);

export const printers: Record<string, Printer> = {
  estree: {
    ...base,
    print(path, options, print, args) {
      return isArrowIntoR(path.node) ? printArrowIntoR(path, options, print) : base.print(path, options, print, args);
    },
  },
};
