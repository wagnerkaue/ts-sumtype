import { describe, it, expect } from "vitest";
import { format, type Options } from "prettier";
import * as rPlugin from "../src/prettier";

const kaavaStyle: Options = {
  parser: "typescript",
  plugins: [rPlugin],
  semi: false,
  tabWidth: 4,
  printWidth: 100,
  arrowParens: "avoid",
  trailingComma: "all",
  objectWrap: "preserve",
};

async function formattedTwice(source: string, options: Options = {}): Promise<readonly [string, string]> {
  const once = await format(source, { ...kaavaStyle, ...options });
  return [once, await format(once, { ...kaavaStyle, ...options })];
}

const cases: readonly (readonly [title: string, source: string, expected: string, options?: Options])[] = [
  [
    "keeps r and the callback on the arrow's line",
    `const name = (path: Path): Result<string, NameError> =>
    r($ => {
        return $.fail("empty")
    })
`,
    `const name = (path: Path): Result<string, NameError> => r($ => {
    return $.fail("empty")
})
`,
  ],
  [
    "breaks the arrow's signature when the line is too long",
    `const objectLeaves = (fields: ObjectShape, options: LeafOptions): Result<Leaves, ObjectLeavesError> => r($ => {
    return $.fail("noFields")
})
`,
    `const objectLeaves = (
    fields: ObjectShape,
    options: LeafOptions,
): Result<Leaves, ObjectLeavesError> => r($ => {
    return $.fail("noFields")
})
`,
  ],
  [
    "keeps a sole destructured parameter hugged when the signature breaks",
    `const fieldLeaves = ({ key, value, options }: FieldWithOptions): Result<Leaves, FieldLeavesError> => r($ => {
    return $.fail("dotInKey")
})
`,
    `const fieldLeaves = ({
    key,
    value,
    options,
}: FieldWithOptions): Result<Leaves, FieldLeavesError> => r($ => {
    return $.fail("dotInKey")
})
`,
  ],
  [
    "keeps a one-expression body on the line when it fits",
    `const empty = (list: List): Result<List, EmptyError> => r($ => $.fail("empty"))
`,
    `const empty = (list: List): Result<List, EmptyError> => r($ => $.fail("empty"))
`,
  ],
  [
    "moves a one-expression body that doesn't fit to the next line",
    `const arrayLeaves = (_array: ArrayShape): Result<Leaves, ArrayLeavesError> => r($ => $.fail("notStorable"))
`,
    `const arrayLeaves = (_array: ArrayShape): Result<Leaves, ArrayLeavesError> => r($ =>
    $.fail("notStorable"))
`,
  ],
  [
    "puts parentheses around the callback's parameter when arrowParens is always",
    `const name = (path: Path): Result<string, NameError> => r($ => {
    return $.fail("empty")
})
`,
    `const name = (path: Path): Result<string, NameError> => r(($) => {
    return $.fail("empty")
})
`,
    { arrowParens: "always" },
  ],
  [
    "keeps a destructured callback parameter on one line",
    `const name = (path: Path): Result<string, NameError> => r(({
    fail,
}) => {
    return fail("empty")
})
`,
    `const name = (path: Path): Result<string, NameError> => r(({ fail }) => {
    return fail("empty")
})
`,
  ],
  [
    "prints the arrow's type parameters",
    `const pair = <A, B>(first: A, second: B): Result<readonly [A, B], PairError> => r($ => {
    return [first, second]
})
`,
    `const pair = <A, B>(first: A, second: B): Result<readonly [A, B], PairError> => r($ => {
    return [first, second]
})
`,
  ],
  [
    "keeps a comment on a parameter",
    `const commented = (
    // the shape to read
    shape: Shape,
): Result<Leaves, LeavesError> => r($ => {
    return $.fail("noFields")
})
`,
    `const commented = (
    // the shape to read
    shape: Shape,
): Result<Leaves, LeavesError> => r($ => {
    return $.fail("noFields")
})
`,
  ],
  [
    "applies to an object's property and a class's field",
    `const handlers = {
    object: (fields: ObjectShape): Result<Leaves, ObjectLeavesError> =>
        r($ => {
            return $.fail("noFields")
        }),
}
class Store {
    read = (key: string): Result<Row, ReadError> =>
        r($ => {
            return $.fail("missing")
        })
}
`,
    `const handlers = {
    object: (fields: ObjectShape): Result<Leaves, ObjectLeavesError> => r($ => {
        return $.fail("noFields")
    }),
}
class Store {
    read = (key: string): Result<Row, ReadError> => r($ => {
        return $.fail("missing")
    })
}
`,
  ],
];

describe("an arrow whose body is r(callback)", () => {
  for (const [title, source, expected, options] of cases) {
    it(title, async () => {
      expect(await formattedTwice(source, options)).toEqual([expected, expected]);
    });
  }
});

describe("other arrows", () => {
  it.each([
    [
      "a call body moves to the line after the arrow",
      `const f = (x: number) => g(y => {
    return y
})
`,
      `const f = (x: number) =>
    g(y => {
        return y
    })
`,
    ],
    [
      "an arrow without a return type is formatted like any arrow",
      `const f = (x: number) => r($ => {
    return x
})
`,
      `const f = (x: number) =>
    r($ => {
        return x
    })
`,
    ],
    [
      "an async callback in r is formatted like any call",
      `const f = (x: number): R => r(async $ => {
    return x
})
`,
      `const f = (x: number): R =>
    r(async $ => {
        return x
    })
`,
    ],
  ])("%s", async (_, source, expected) => {
    expect(await formattedTwice(source)).toEqual([expected, expected]);
  });
});
