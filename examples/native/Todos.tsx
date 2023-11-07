import React from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Switch,
  Text,
  View,
} from 'react-native';
import {useLiveQuery} from 'use-fireproof';

type Todo = {
  completed: boolean;
  text: string;
};

const Todos = () => {

  console.log({useLiveQuery});

  // const todos: ArrayLike<Todo> | null | undefined = [];
  const todos = useLiveQuery('date', {limit: 10, descending: true}).docs;

  const renderTodo = ({item}: ListRenderItemInfo<Todo>) => {
    return (
      <View>
        <Switch
          // onValueChange={() => null}
          value={item.completed}
        />
        <Text>{item.text as string}</Text>
      </View>
    );
  };

  return (
    <View>
      <FlatList<Todo> data={todos} renderItem={renderTodo} />
    </View>
  );

};

export default Todos;