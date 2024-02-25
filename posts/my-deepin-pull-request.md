> {
>   "title": "我对deepin的第一个pull request",
>   "datetime": "2022年6月22日 9:31"
> }

# 前因

如果关注过deepin社区或者关注过我的人可能注意到过一年前我对deepin-launcher的窗口模式滚动体验提出的优化意见，但可能是由于“排期问题”或者“优先级不高”，一年过去了仍然没有解决。近期deepin声明自己开始接受外部贡献，因此我提交了此pull request（虽然看起来他们已经将开发重心转移到了V23）。

pull request地址：https://github.com/linuxdeepin/dde-launcher/pull/136

# 简介

这个提交主要是为了解决滚动体验不佳的问题，目前正在使用deepin的朋友可以试一下，打开启动器的窗口模式，尝试慢慢滚动鼠标滚轮，作为对比，再重新尝试快速滚动滚轮，你会发现，快速滚动滚轮的时候，启动器的滚动速度反而变低，滚动距离反而变短。

## 原因分析

主要是不正确地引入了动画机制导致的，在现在的情况下，动画逻辑是每触发一次滚动事件，将触发滚动动画，动画时间为800毫秒。但如果两次滚动事件触发的间隔很短，短到小于800毫秒的话，新的滚动事件就会先打断上一次的滚动动画。 简而言之，就是上一次的滚动动画还没结束，就被中断了。导致滚动的距离达不到一次完成滚动动画的距离，因此如果快速滚动，就会频繁地进行触发-打断再触发-打断再触发...，导致滚动距离和速度都达不到预期效果。

## 怎么解决

先不考虑具体代码实现，解决这个问题，主要是解决动画被打断后，滚动效果失真的问题，也就是说，要保证打断之后，不影响滚动距离的计算。

所以，可以设置一个目标点的变量，将该变量初始化为滚动条当前的位置，滚轮滚动事件触发后，在触发动画之前，先去修改这个目标点变量，将其直接变更为新的目标点，随后激活动画，将目标位置设置为该变量的值。如此，即使动画被下一次的事件打断，目标点变量已经设置为了正确的目标位置，新的滚动动画触发后，再根据目标点的变量进行计算并设置滚动目标，就很好地避免了滚动距离失真的问题。

在解决这个问题之后，滚动速度的问题也迎刃而解，当设置“目标点”机制后，动画触发时的目的位置与当前位置的距离就不再和原来一样相等，快速滚动时距离会变大，但动画时间是一定的，因此滚动速度也会随之变快。

## 代码实现

为了实现这个方案，首先创建一个滚动条类，基于原生滚动条去修改。

smoothscrollbar.h

```cpp
#ifndef SMOOTHSCROLLBAR_H
#define SMOOTHSCROLLBAR_H

#include <QWidget>
#include <QScrollBar>
#include <QPropertyAnimation>

class SmoothScrollBar : public QScrollBar
{
    Q_OBJECT
public:
    explicit SmoothScrollBar(QWidget *parent = nullptr);

signals:
    void scrollFinished();

public slots:
    void setValueSmooth(int value);
    void scrollSmooth(int value);
    void stopScroll();

private:
    int m_targetValue;

    QPropertyAnimation *m_propertyAnimation;
};

#endif // SMOOTHSCROLLBAR_H
```

smoothscrollbar.cpp
```cpp
#include "smoothscrollbar.h"
#include <QPropertyAnimation>

SmoothScrollBar::SmoothScrollBar(QWidget *parent)
    : QScrollBar(parent)
    , m_propertyAnimation(new QPropertyAnimation(this, "value", this))
{
    m_targetValue = value();

    m_propertyAnimation->setDuration(800);
    m_propertyAnimation->setEasingCurve(QEasingCurve::OutCubic);

    connect(m_propertyAnimation, &QPropertyAnimation::finished, this, &SmoothScrollBar::scrollFinished);
}

void SmoothScrollBar::setValueSmooth(int value)
{
    m_propertyAnimation->stop();
    m_propertyAnimation->setEndValue(value);
    m_propertyAnimation->start();
}

void SmoothScrollBar::scrollSmooth(int value)
{
    // 这里先对m_targetValue限制是为了实现撞停的效果，否则滚动到上下边缘会减速
    m_targetValue = qBound(minimum(), m_targetValue, maximum());
    m_targetValue += value;
    setValueSmooth(m_targetValue);
}

void SmoothScrollBar::stopScroll()
{
    m_propertyAnimation->stop();
    m_targetValue = value();
}
```

该类主要实现的接口是`scrollSmooth(int)`，该接口的作用是触发平滑滚动，并滚动一定距离，连续触发时会使用“目标点”机制，防止滚动失真。

在使用此接口时，首先调用控件的`setVerticalScrollBar()`或者`setHorizontalScrollBar()`方法，将滚动条设置为新滚动条类的对象。
然后重写`void wheelEvent(QWheelEvent *e)`方法，大概像这样：

```cpp
void AppListView::wheelEvent(QWheelEvent *e) {
    m_scrollbar->scrollSmooth(-e->angleDelta().y());
}
```

# 无关的话

最近学了两天小程序开发，觉得确实不错，虽然有些槽点。比如开发者居然没有方法去在后台直接操作数据库中的数据（小程序自己的云开发提供的json数据库），这一点不太理解。还是优点居多，虽然大家都经常对着腾讯骂娘，但是我们还是没办法离开微信，微信的普及程度都快赶上身份证了。

此外还在学rust，不得不说是真难。