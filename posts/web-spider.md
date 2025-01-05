> {
>   "title": "记录一次简单的爬虫",
>   "datetime": "2025年1月5日 21:55"
> }

# 前因

虽然已经毕业了，但是还是在和大学同学搞事情。

最近他们让我搞一个爬虫，把某网站的所有商品名称爬下来，这种没啥水平又听起来听牛逼的小活我自然是喜欢干的。

# 后果

写下如下脚本，可供以后参考，使用了Python + Selenium4：

```python
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

# 设置Chrome浏览器选项
opt = webdriver.ChromeOptions()
opt.add_argument(r"user-data-dir=./data")

# 设置Chrome浏览器服务
ser = webdriver.ChromeService(executable_path="./chromedriver_linux64/chromedriver")
driver = webdriver.Chrome(service=ser, options=opt)

# 打开目标网址
url = "https://something.com/goods_cate"
driver.get(url)
time.sleep(1)  # 减少等待时间

res = []  # 存储商品名称的列表
lastnum = 0  # 上一次获取的商品数量

while True:
    # 模拟按下键盘的END键，滚动到页面底部
    driver.find_element(by=By.TAG_NAME, value="body").send_keys(Keys.END)
    time.sleep(1)  # 减少等待时间

    # 获取页面上的商品元素列表
    ls = driver.find_elements(by=By.CSS_SELECTOR, value=".goods_cate .goods .item")

    for l in ls:
        # 获取商品名称
        title = l.find_element(by=By.CLASS_NAME, value="name").text
        if title in res:
            continue  # 如果商品名称已存在于列表中，则跳过
        res.append(title)  # 将商品名称添加到列表中
        print(title)  # 打印商品名称

    if lastnum == len(res):
        break  # 如果商品数量没有增加，则退出循环
    lastnum = len(res)  # 更新上一次获取的商品数量

# 将res中的字符串存储到文本文件中
with open("output.txt", "w") as f:
    for item in res:
        f.write("%s\n" % item)
```

每次写爬虫都要搜来搜去，这次做个记录备查，方便以后再有此需求可快速找到。
