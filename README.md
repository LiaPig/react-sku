# SKU商品规格选择

![SKU商品规格选择](https://upload-images.jianshu.io/upload_images/7016617-cefead4994fd107a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 在线demo地址
https://qdnzv.csb.app/
https://codesandbox.io/s/distracted-albattani-qdnzv?file=/src/App.js

# 文档地址
https://www.jianshu.com/p/f398b3bdaa67

# 实现思路
1. 根据商品的规格`（如型号/颜色/内存）`来推导这个商品支持的所有规格排列组合`如([null, null, null])`。（当某规格没选的时候使用 `null` 来表示）
2. 当用户点击某选项`（如"黑色"）`时，拿到此时所有规格的选项（没选用`null`）来表示`如（[null, '黑色', null]）`，去遍历所有商品，是否有支持这个组合的商品
3. 拿到所有支持的商品的选项`（如["iPhone X", "iPhone XS", "黑色", "64g"]）`，这些就是此时可点击的选项（要注意去重和用户点击的当前选项）。同时可得知那些既不属于可点击的选项，又不是当前点击的选项，就是不可点击的选项。`（如"128g"、"256g"）`
4. 根据刚得到的结果来遍历所有选项修改它们的状态
5. 可发现，同级的选项在商品的规格选项中不存在`（如上面的例子中按道理来说"白色"选项也应该可点击）`，所以要特殊处理这种情况。可通过遍历当前用户的所有规格选项，有值的（不为`null`）的规格改为 `null` 再去求。`（如[null, '黑色', null]改为[null, null, null]去求支持的商品的所有属于“颜色”这个规格的选项）`
6. 根据刚得到的结果来修改可被点击的有值的同级选项的状态

# 相关原始数据
商品规格：有三个规格：型号（有两个选项）、颜色（有两个选项）、内存（有三个选项）
```js
const names = ["iPhone X", "iPhone XS"];
const colors = ["黑色", "白色"];
const storages = ["64g", "128g", "256g"];
```

现有商品：简单的表示，在这数组里就说明有货
```js
const products = [
  {
    id: 1,
    options: ["iPhone X", "黑色", "64g"],
  },
  {
    id: 2,
    options: ["iPhone XS", "黑色", "64g"],
  },
  {
    id: 3,
    options: ["iPhone X", "白色", "64g"],
  },
  {
    id: 4,
    options: ["iPhone X", "白色", "256g"],
  },
];
```
渲染的数据（将商品规格组合起来）
```js
const renderData = [
  {
    id: 1,
    title: "型号",
    options: names,
  },
  {
    id: 2,
    title: "颜色",
    options: colors,
  },
  {
    id: 3,
    title: "内存",
    options: storages,
  },
];
```

# 相关函数封装
## 一、全排列组合函数
请参阅，讲解的十分详细：
https://juejin.cn/post/6844904191379374087

```
// 因为不能确定传进来需要排列组合的参数有多少，所以使用 ...chunks 来全部获取
// chunks == [names , colors, storages]
const combine = function (...chunks) {
  const res = [];
  
  // 递归函数，第一个参数为chunks的index，代表是第几个要排列的组合，prev为上一个递归操作的结果
  const helper = function (chunkIndex, prev) {
    // 获取当前要排列的数组
    const chunk = chunks[chunkIndex];
    // 是否是最后一个要排列的数组了，递归结束的标志
    const isLast = chunkIndex === chunks.length - 1;
    for (let val of chunk) {
      const cur = prev.concat(val);
      if (isLast) {
        res.push(cur);
      } else {
        helper(chunkIndex + 1, cur);
      }
    }
  };

  helper(0, []);
  return res;
};
```

## 二、根据某规格选项获取它的全排列组合

1. 需要加上 `null` 这种情况（代表没选这个规格）
2. 为了后续方便判断，把组合情况转化为字符串。

```js
const getOptionCombine = function (options) {
  const all = options.map((item) => {
    return [item, null];
  });
  const result = combine(...all);

  return result.map((item) => JSON.stringify(item));
};
```

在本例中，`options` 的期待输入格式为： `["iPhone X", "黑色", "64g"]`

对此，期待函数的输出应该为：
```js
[
  "["iPhone X","黑色","64g"]", 
  "["iPhone X","黑色",null]",
  "["iPhone X",null,"64g"]",
  "["iPhone X",null,null]", 
  "[null,"黑色","64g"]",
  "[null,"黑色",null]",
  "[null,null,"64g"]",
  "[null,null,null]"
]
```


## 三、通过商品来获取用户可能点击的规格的全排列组合
与商品数据放在一起，方便后续比较。
```js
// 获取所有用户可能的选择组合
const userCombine = products.map((item) => {
  return {
    ...item,
    combine: getOptionCombine(item.options),
  };
});
```
![userCombine 应该如图所示](https://upload-images.jianshu.io/upload_images/7016617-f833f9e83c3acba8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 四、根据选择的所有规格获取支持商品的所有选项
选项的三个状态：`normal` 为可点击、`disabled` 为不可点击、`selected` 为当前选中。
```js
const getNormalOption = (tempCurrent) => {
  const normalOption = [];
  // 遍历所有商品规格
  for (let item of userCombine) {
    if (item.combine.includes(JSON.stringify(tempCurrent))) {
      // console.log("这个商品有：", item);

      // optionStatus 为所有规格和其状态的集合对象，后面会有声明
      for (let option in optionStatus) {
        // 要注意去重
        if (item.options.includes(option) && !normalOption.includes(option)) {
            normalOption.push(option);
        }
      }
    }
  }

  return normalOption;
};
```

## 五、查询商品中有无这个选项
在初始化选项状态时会用到。
```js
const findOption = function (option) {
  for (let item of products) {
    if (item.options.includes(option)) {
      return true
    }
  }
  return false
}
```

## 六、获取同级规格的其他能被点击的选项
```js
// option为某选项，current为当前所有规格的选择
const getSiblingNormalOption = (option, current) => {
  // 分别找到这个有的值是在哪个规格
  const specIndex = renderData.findIndex((item) =>
    item.options.includes(option)
  );
  // 将这个规格设置为null来求其他选项的状态
  const siblingCurrent = [...current];
  siblingCurrent[specIndex] = null;

  // 找到其他同级能被点击的（要过滤掉自己）
  const options = renderData[specIndex].options;
  const peerNormalOption = getNormalOption(siblingCurrent).filter((item) => {
    if (options.includes(item) && item !== option) {
      return item;
    }
  });

  return peerNormalOption;
};
```

# 页面状态
## 1. 当前所有规格的选中项目集合
都没选则为 `null` ，初始应都为 `null`。
```js
const [current, setCurrent] = useState(() => {
  return new Array(renderData.length).fill(null);
});
```

## 2. 用这个对象来映射每一个规格对应的状态
`key` 为选项，`value` 为它的状态（`-1` 为不可点击，`0` 为可点击，`1` 为已选中）
形如：`{ "黑色": 0, "白色": 0 }`。
```js
const [optionStatus, setOptionStatus] = useState(() => {
  const arr = names.concat(colors, storages);
  const result = {};
  for (let item of arr) {
    result[item] = findOption(item) ? 0 : -1;
  }
  return result;
});
```

# 完整代码
```jsx
import React, { useState } from "react";

// 商品规格
const names = ["iPhone X", "iPhone XS"];
const colors = ["黑色", "白色"];
const storages = ["64g", "128g", "256g"];
// 现有商品
const products = [
  {
    id: 1,
    options: ["iPhone X", "黑色", "64g"],
  },
  {
    id: 2,
    options: ["iPhone XS", "黑色", "64g"],
  },
  {
    id: 3,
    options: ["iPhone X", "白色", "64g"],
  },
  {
    id: 4,
    options: ["iPhone X", "白色", "256g"],
  },
];
// 渲染的数据
const renderData = [
  {
    id: 1,
    title: "型号",
    options: names,
  },
  {
    id: 2,
    title: "颜色",
    options: colors,
  },
  {
    id: 3,
    title: "内存",
    options: storages,
  },
];

// 样式们
const disabledStyle = {
  margin: "0 20px",
  padding: "5px 10px",
  color: "rgba(0,0,0,.25)",
  background: "#f5f5f5",
  border: "1px solid",
  borderColor: "#d9d9d9",
};
const normalStyle = {
  margin: "0 20px",
  padding: "5px 10px",
  color: "rgba(0,0,0,.85)",
  background: "#fff",
  border: "1px solid",
  borderColor: "#d9d9d9",
};
const selectedStyle = {
  margin: "0 20px",
  padding: "5px 10px",
  color: "#fff",
  background: "#1890ff",
  border: "1px solid",
  borderColor: "#1890ff",
};

const combine = function (...chunks) {
  const res = [];

  const helper = function (chunkIndex, prev) {
    const chunk = chunks[chunkIndex];
    const isLast = chunkIndex === chunks.length - 1;
    for (let val of chunk) {
      const cur = prev.concat(val);
      if (isLast) {
        res.push(cur);
      } else {
        helper(chunkIndex + 1, cur);
      }
    }
  };

  helper(0, []);

  return res;
};
const getOptionCombine = function (options) {
  const all = options.map((item) => {
    return [item, null];
  });
  const result = combine(...all);

  return result.map((item) => JSON.stringify(item));
};

// 获取所有用户可能的选择组合
const userCombine = products.map((item) => {
  return {
    ...item,
    combine: getOptionCombine(item.options),
  };
});
// console.log("获取所有用户可能的选择", userCombine);

// 查询商品中有无这个选项
const findOption = function (option) {
  for (let item of products) {
    if (item.options.includes(option)) {
      return true;
    }
  }
  return false;
};

export default () => {
  // 当前选择
  const [current, setCurrent] = useState(() => {
    return new Array(renderData.length).fill(null);
  });
  // 专门用这个对象来映射每一个规格对应的状态
  const [optionStatus, setOptionStatus] = useState(() => {
    const arr = names.concat(colors, storages);
    const result = {};
    for (let item of arr) {
      result[item] = findOption(item) ? 0 : -1;
    }
    return result;
  });

  const onClick = (index, optionIndex) => {
    // 用户点击的选项
    const selectedItem = renderData[index]["options"][optionIndex];
    // 当前选中
    const tempCurrent = [...current];
    // 将要修改的状态对象
    const temp = { ...optionStatus };

    // 点击了是不可点击的
    if (optionStatus[selectedItem] === -1) {
      return;
    }

    // 获取到用户当前的规则选择状态（要区别是否为取消选中）
    if (current[index] === selectedItem) {
      tempCurrent[index] = null;
      temp[selectedItem] = 0;
    } else {
      tempCurrent[index] = selectedItem;
      temp[selectedItem] = 1;
    }
    // console.log("用户当前选择规格", tempCurrent);

    const normalOption = getNormalOption(tempCurrent);
    // 遍历处理每一个选项的状态
    for (let item in temp) {
      // 不可选
      if (!normalOption.includes(item)) {
        temp[item] = -1;
      } else {
        // 可选
        if (tempCurrent.includes(item)) {
          temp[item] = 1;
        } else {
          temp[item] = 0;
        }
        // console.log(tempCurrent);
      }
		}
		
    // 再特殊处理每一个有值的选项的同级
    const valueCurrent = tempCurrent.filter((item) => !!item);
    for (let value of valueCurrent) {
      const normalOptions = getSiblingNormalOption(value, tempCurrent);
      for (let option of normalOptions) {
        temp[option] = 0;
      }
    }

    setCurrent(tempCurrent);
    setOptionStatus(temp);
  };

  const getNormalOption = (tempCurrent) => {
    const normalOption = [];
    for (let item of userCombine) {
      if (item.combine.includes(JSON.stringify(tempCurrent))) {
        // console.log("这个商品有：", item);
        // 点亮这个商品的状态
        for (let option in optionStatus) {
          if (item.options.includes(option) && !normalOption.includes(option)) {
            normalOption.push(option);
          }
        }
      }
    }

    return normalOption;
  };

  // 获取同级规格的其他能被点击的选项
  const getSiblingNormalOption = (option, current) => {
    // 分别找到这个有的值是在哪个规格
    const specIndex = renderData.findIndex((item) =>
      item.options.includes(option)
    );
    // 将这个规格设置为null来求其他选项的状态
    const siblingCurrent = [...current];
    siblingCurrent[specIndex] = null;

    // 找到其他同级能被点击的（要过滤掉自己）
    const options = renderData[specIndex].options;
    const peerNormalOption = getNormalOption(siblingCurrent).filter((item) => {
      if (options.includes(item) && item !== option) {
        return item;
      }
    });

    return peerNormalOption;
  };

  return (
    <div>
      {renderData.map((item, index) => (
        <div key={item.id}>
          <p>{item.title}</p>
          <div>
            {item.options.map((option, optionIndex) => (
              <span
                key={option}
                style={
                  optionStatus[option] === -1
                    ? disabledStyle
                    : optionStatus[option] === 1
                    ? selectedStyle
                    : normalStyle
                }
                onClick={() => onClick(index, optionIndex)}
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```