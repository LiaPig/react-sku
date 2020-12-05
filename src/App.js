// import logo from './logo.svg';
// import './App.css';
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

function App() {
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
      return false;
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
}

export default App;
