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
    this.list = goods;
    this.attrKey = (() => {
      const result = new Set();
      for (let item of goods) {
        Object.keys(item).forEach((attr) => {
          result.add(attr);
        });
      }
      return Array.from(result);
    })();
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
  const adaptedOption = useMemo(() => example.adaptedAttr(selected), [
    selected,
  ]);
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
