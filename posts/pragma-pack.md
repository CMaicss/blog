> {
>   "title": "C/C++内存数据解析法门",
>   "datetime": "2025年1月8日 21:49"
> }

# 前因

工作中遇到一个很简单的问题，要开发网络通信相关功能。其中要实现基于二进制的通信协议。

# 展开

在基于二进制的网络传输协议中往往类似以下定义：

```
| 2 bytes | 2 bytes | 2 bytes |
|---------|---------|---------|
| version |  length |  flag   |
|     data content ...        |
```

其本质上是**靠字节位来定义数据的含义**，在C/C++程序中，要解析这类数据，有两种方法：

1. 浮动指针法（自己起的名字，别介意）：通过创建一个 `char*`，顺序按长度读取数据，每读取一个元素向后移动一次，直到数据读完。
2. 结构体对齐法：通过创建一个和协议相对应的结构体，一次性的读取到内存中的数据，但要注意结构体内部的对齐方式。

我认为方法2更加简单且易读。例如以上数据头可以定义一个结构体：

```c++
struct DataHead {
    uint16 version;
    uint16 length;
    uint16 flag;
}
```

结构体内部的数据是按顺序排列的，上面这个结构体在解析上的用法：

```c++
// char* data
DataHead* head = (DataHead*)data;

std::cout << "Version:" << version << std::endl;
std::cout << "Length:" << length << std::endl;
std::cout << "Flag:" << flag << std::endl;
```

但要注意的是结构体当内部元素大小不一时，其内部的对齐机制不会使所有变量的内存都是连续的（要具体了解可以搜索：结构体内存对齐）

要编译器不进行对齐，只简单的把结构体内变量的内存连续排列，可以在结构体定义时使用`#pragma pack(1)`：

```c++
#pragma pack(1)  // 使内存向1字节对齐（无间隔）
struct DataHead {
    uint16 version;
    uint16 length;
    uint16 flag;
}
#pragma pack()  // 后面的内容恢复默认对齐方式
```
