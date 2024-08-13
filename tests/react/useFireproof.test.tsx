import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useFireproof } from "use-fireproof";
import { Todo } from "../helpers";

describe("HOOK: useFireproof", () => {
  it("should be defined", () => {
    expect(useFireproof).toBeDefined();
  });

  it("renders the hook correctly and checks types", () => {
    renderHook(() => {
      const { database, useLiveQuery, useDocument } = useFireproof("dbname");
      expect(typeof useLiveQuery).toBe("function");
      expect(typeof useDocument).toBe("function");
      expect(database?.constructor.name).toBe("Database");
    });
  });
  it("undefined means generate _id", async () => {
    const resUseFireproof = renderHook(() => useFireproof("dbnamex"));
    const { useDocument } = resUseFireproof.result.current;
    const resUseDocument = renderHook(() =>
      useDocument<Todo>(() => ({
        text: "",
        date: Date.now(),
        completed: false,
      })),
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [todo, setTodo, saveTodo] = resUseDocument.result.current;

    const texts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const text = ">" + Math.random().toString(36).substring(7);
      act(() => {
        setTodo({ text, date: Date.now(), completed: false });
      });
      texts.push(text);
      await act(() => saveTodo());
      //console.log("res", res);
    }
  });

});
