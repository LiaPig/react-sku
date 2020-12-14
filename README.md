# SKU 商品规格选择

![SKU商品规格选择](https://upload-images.jianshu.io/upload_images/7016617-cefead4994fd107a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 在线 demo 地址

https://qdnzv.csb.app/

# 文档地址

https://www.jianshu.com/p/f398b3bdaa67

# Goods 类的相关说明

## 生成实例需要传入商品对象数组

`key: string` 为 商品规格名称，`value: [string]` 为该商品此规格的值。如：

```js
const goods = [
  {
    // "商品规格名称": "该商品此规格的值",
    name: "iPhone X",
    color: "黑色",
    storage: "64g",
  },
  {
    color: "黑色",
    name: "iPhone XS",
    storage: "64g",
  },
  {
    color: "白色",
    name: "iPhone X",
    storage: "64g",
  },
  {
    color: "白色",
    name: "iPhone X",
    storage: "256g",
  },
];
```

## this.list

返回商品实例的数据。

```js
[
  {
    name: "iPhone X",
    color: "黑色",
    storage: "64g",
  },
  {
    color: "黑色",
    name: "iPhone XS",
    storage: "64g",
  },
  {
    color: "白色",
    name: "iPhone X",
    storage: "64g",
  },
  {
    color: "白色",
    name: "iPhone X",
    storage: "256g",
  },
];
```

## this.attrKey

根据商品数据，可获得由所有商品的规格 key 组成的数组。

```js
["name", "color", "storage"];
```

## this.attr

根据商品数据，可获得商品全部属性选项对象。

```js
{
  "name": [
    "iPhone X",
    "iPhone XS"
  ],
  "color": [
    "黑色",
    "白色"
  ],
  "storage": [
    "64g",
    "256g"
  ]
}
```

## this.have(option)

判断有没有这个规格 option 的商品，返回布尔值。

```js
const goods = [
  {
    // "商品规格名称": "该商品此规格的值",
    name: "iPhone X",
    color: "黑色",
    storage: "64g",
  },
  {
    color: "黑色",
    name: "iPhone XS",
    storage: "64g",
  },
  {
    color: "白色",
    name: "iPhone X",
    storage: "64g",
  },
  {
    color: "白色",
    name: "iPhone X",
    storage: "256g",
  },
];
const example = new Goods(goods);
const option1 = { name: "iPhone X", color: "黑色", storage: "64g" };
const option2 = { name: "iPhone X", color: "黑色", storage: "128g" };
//
example.have(option1); // true
example.have(option2); // false
```

## this.find(option)

查找匹配商品。如果找到了，就返回商品标识（商品为数组则返回数组索引 index）；如果没找到，则返回 undefined 。

```js
example.find({ name: "iPhone X", color: "黑色", storage: "64g" }); // 0
example.find({ name: "iPhone X", color: "黑色", storage: "128g" }); // undefined
```

## adaptedAttr

判断属性可用性。

```js
const adaptedAttr = example.adaptedAttr({ name: "iPhone X", color: "黑色" });

// {
//   "name": [
//     "iPhone X",
//     "iPhone XS"
//   ],
//   "color": [
//     "黑色",
//     "白色"
//   ],
//   "storage": [
//     "64g"
//   ]
// }
```

## this.combine(...chunks)

排列组合函数。

请参阅，讲解的十分详细： https://juejin.cn/post/6844904191379374087

## this.allOptions()

根据商品的规格，来推测用户选择的所有规格组合。

## this.result

提前计算好所有规格组合对应的可被点击的选项。

## this.getAdaptedAttrByResult(option)

根据 option 快速获取已经提前计算好的对应的可用属性。

# 可选属性实现思路

1. 当用户点击某选项`（如"黑色"）`时，拿到此时所有规格的选项（ `{ color: "黑色" }`）
2. 根据商品数据、用户当前选择规格，查找匹配商品。如果找到了，就返回商品标识（商品为数组则返回数组索引 index）；如果没找到，则返回 undefined 。(`this.find(option)`)
3. 拿到所有支持的商品的选项`（如["iPhone X", "iPhone XS", "黑色", "64g"]）`，这些就是此时可点击的选项（要注意去重）。
4. 可发现，同级的选项在商品的规格选项中不存在`（如上面的例子中按道理来说"白色"选项也应该可点击）`，所以要特殊处理这种情况。可通过遍历当前用户的所有规格选项，有值的（不为`null`）的规格改为其他选项再去求。`（如 { color: "黑色" } 改为 { color: "白色" } 去求支持的商品的所有属于“颜色”这个规格的选项）`
5. 根据刚得到的结果来修改可被点击选项的状态，不包含的选项就是不可被点击的。

# 完整代码

```jsx
import React, { useState, useMemo } from "react";

// 现有商品
const goods = [
  {
    id: 1,
    options: {
      name: "iPhone X",
      color: "黑色",
      storage: "64g",
    },
  },
  {
    id: 2,
    options: {
      name: "iPhone XS",
      color: "黑色",
      storage: "64g",
    },
  },
  {
    id: 3,
    options: {
      name: "iPhone X",
      color: "白色",
      storage: "64g",
    },
  },
  {
    id: 4,
    options: {
      name: "iPhone X",
      color: "白色",
      storage: "256g",
    },
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
const zh = {
  name: "型号",
  color: "颜色",
  storage: "内存",
};

// 商品类
const Goods = class Goods {
  constructor(goods) {
    // 商品列表数据
    this.list = goods;
    // 由所有商品的规格 key 组成的数组
    this.attrKey = (() => {
      const result = new Set();
      for (let item of goods) {
        Object.keys(item).forEach((attr) => {
          result.add(attr);
        });
      }
      return Array.from(result);
    })();
    // 商品全部属性选项对象。此对象的成员的 key 为某规格的 key，value 为 这规格的所有选项数组。
    this.attr = (() => {
      const result = {};
      for (let item of goods) {
        const keys = Object.keys(item);
        for (let key of keys) {
          if (!result[key]) {
            result[key] = [];
          }
          const value = item[key];
          if (!result[key].includes(value)) {
            result[key].push(value);
          }
        }
      }
      return result;
    })();
    // 根据商品预测所有选项组合，从而得到所有组合对应的结果
    this.result = (() => {
      const result = {};
      const all = this.allOptions();
      for (let item of all) {
        const key = Object.values(item).join("--");
        result[key] = this.adaptedAttr(item);
      }
      return result;
    })();
  }
  have(option) {
    if (Object.prototype.toString.call(option) !== "[object Object]") {
      return undefined;
    }

    const index = this.list.findIndex((item) => {
      for (let key in option) {
        if (option[key] !== item[key]) {
          return false;
        }
      }
      return true;
    });
    const result = index !== -1;
    return result;
  }
  find(option) {
    if (Object.prototype.toString.call(option) !== "[object Object]") {
      return undefined;
    }

    const result = [];
    this.list.forEach((item, index) => {
      const keys = Object.keys(option);
      const isEqual = keys.every((key) => {
        return option[key] === item[key];
      });
      if (isEqual) {
        result.push(index);
      }
    });
    return result;
  }
  adaptedAttr(option) {
    const list = this.list;
    const result = {};

    for (let key of this.attrKey) {
      result[key] = [];
    }

    // 找到符合该选项规格的商品下标
    const indexArr = this.find(option);
    indexArr.forEach((index) => {
      for (let key in list[index]) {
        const value = list[index][key];
        if (!result[key].includes(value)) {
          result[key].push(value);
        }
      }
    });
    // 与已选的统一规则的要特殊处理
    for (let key in option) {
      const tempOption = { ...option };
      const otherOption = this.attr[key].filter(
        (item) => item !== tempOption[key]
      );
      for (let item of otherOption) {
        tempOption[key] = item;
        if (this.find(tempOption).length > 0) {
          result[key].push(item);
        }
      }
    }
    return result;
  }
  combine(...chunks) {
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
  }
  allOptions() {
    const options = [];
    const optionsKey = [];
    for (let key in this.attr) {
      options.push(this.attr[key].concat(null));
      optionsKey.push(key);
    }
    const result = this.combine(...options).map((item, index) => {
      const obj = {};
      item.forEach((option, optionIndex) => {
        if (!!option) {
          obj[optionsKey[optionIndex]] = option;
        }
      });
      return obj;
    });
    return result;
  }
  getAdaptedAttrByResult(option) {
    const sortOption = [];
    // 排序
    this.attrKey.forEach((item) => {
      if (option[item]) {
        sortOption.push(option[item]);
      }
    });
    return this.result[sortOption.join("--")];
  }
};

const example = new Goods(goods.map((item) => item.options));
const { attr, attrKey } = example;

function App() {
  // 渲染的选择规格数据
  const renderGoods = attrKey.map((key) => {
    if (key === "storage") {
      return {
        label: key,
        list: ["64g", "128g", "256g"],
      };
    }
    return {
      label: key,
      list: attr[key],
    };
  });
  // 当前选中的数据
  const [selected, setSelected] = useState({});
  // 可被选的数据
  const adaptedOption = useMemo(() => {
    return example.getAdaptedAttrByResult(selected);
  }, [selected]);
  // 选项的状态
  const optionStatus = useMemo(() => {
    const result = {};
    renderGoods.forEach((item) => {
      const key = item.label;
      const list = item.list;
      result[key] = {};
      list.forEach((option) => {
        result[key][option] = -1;
        if (adaptedOption[key].includes(option)) {
          result[key][option] = 0;
        }
      });
    });
    return result;
  }, [adaptedOption, renderGoods]);

  function onClick(value, optionKey) {
    // 禁用不可点
    if (!optionStatus[optionKey] || optionStatus[optionKey][value] === -1) {
      return;
    }

    const tempSelected = { ...selected };
    // 是否是取消
    if (tempSelected[optionKey] === value) {
      delete tempSelected[optionKey];
    } else {
      tempSelected[optionKey] = value;
    }
    setSelected(tempSelected);
  }

  return (
    <div>
      {renderGoods.map((options, index) => (
        <div key={index}>
          <p>{zh[options.label]}</p>
          <div>
            {options.list.map((item, itemIdx) => (
              <span
                key={itemIdx}
                onClick={() => onClick(item, options.label)}
                style={
                  optionStatus[options.label][item] === -1
                    ? disabledStyle
                    : selected[options.label] === item
                    ? selectedStyle
                    : normalStyle
                }
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
```
