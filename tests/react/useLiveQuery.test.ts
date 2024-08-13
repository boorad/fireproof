import { cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { rt, Database } from "use-fireproof";
import { generateTexts, getUseFireproofHook, getUseLiveQueryHook, populateDatabase } from "../helpers";

const TEST_DB_NAME = "test-useLiveQuery";

describe("HOOK: useLiveQuery", () => {
  let db: Database;
  const texts = generateTexts();

  afterEach(async () => {
    cleanup();
    await db.close();
    await db.destroy();
  });

  beforeEach(async () => {
    await rt.SysContainer.start();
    db = new Database(TEST_DB_NAME);
  });

  it("should be defined", async () => {
    const useFireproofHook = getUseFireproofHook(db);
    const { useLiveQuery } = useFireproofHook.result.current;
    expect(useLiveQuery).toBeDefined();
  });

  it("renders the hook correctly and checks types", () => {
    const useFireproofHook = getUseFireproofHook(db);
    const { useLiveQuery } = useFireproofHook.result.current;
    expect(typeof useLiveQuery).toBe("function");
  });


  it("reads from the database", async () => {
    // populate database with test data
    await populateDatabase(db, texts);
    const allDocs = await db.allDocs();

    // render hook
    const useFireproofHook = getUseFireproofHook(db);
    const { useLiveQuery } = useFireproofHook.result.current;

    const useLiveQueryHook = getUseLiveQueryHook(useLiveQuery);
    const todos = useLiveQueryHook.result.current;
    console.log("todos", todos, "\n");
    expect(todos.docs.length).toBe(allDocs.rows.length);
  });

/*
    // get allDocs function call results
    const allDocs = await db.allDocs();

    expect(allDocs.rows.length).toBe(texts.length);
    expect(todos.docs.length).toBe(texts.length);

    // const resUseDocument = renderHook(() => useDocument<Todo>(() => (defaultTodo)));
    // const [todo, setTodo, saveTodo] = resUseDocument.result.current;

    // let state = 0;
    // const text = texts[texts.length - 1];
    // console.log({state, textsLength: texts.length, todosLength: todos.length});

    switch (state) {
      case 3:
      case 0:
        console.log(">-1", state);
        texts.push(text);
        act(() => {
          setTodo({ text, date: Date.now(), completed: false });
        });
        console.log(">-1.1", state);
        expect(todo.text).toBe(text);
        console.log(">-1.2", state);
        expect(todo._id).toBeUndefined();
        console.log(">-2", state);
        break;
      case 4:
      case 1:
        {
          console.log("4>", state);
          const res = await act(() => saveTodo());
          console.log("5>", state, res);
        }
        break;
      case 5:
      case 2:
        console.log("0>", state);
        expect(todo.text).toBe(text);
        console.log("1>", state);
        expect(todo._id).toBeDefined();

        // if (state >= 5) done();
        break;
      default:
        {
          console.log("<X>", state);
          console.log("2>", state, todos.docs);
          // let docs: LiveQueryResult<
          //   Partial<{
          //     readonly text: string;
          //     readonly date: number;
          //     readonly completed: boolean;
          //   }>
          // >;
          // await act(() => {
          //   docs = todos.docs.map((i) => i.text).sort();
          // });
          // expect(docs).toEqual(texts.sort());
          console.log("3>", state);
          // done();
        }
        break;
    }
    state++;
  });
  // result.rerender()
*/

});
