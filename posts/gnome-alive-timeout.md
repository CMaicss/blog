> {
>   "title": "Gnome下频繁弹出无响应窗口",
>   "datetime": "2022年6月14日 22:25"
> }

在更换了Arch之后，每次打开游戏的加载页面，都会弹出若干次的无响应提示，需要点击等待即可。 这是因为Gnome的默认设置的窗口无响应监测时间太短了，将其设置为一分钟，会好很多：

```shell
gsettings set org.gnome.mutter check-alive-timeout 60000
```

参考：https://askubuntu.com/questions/1068921/how-to-disable-the-window-not-responding-dialog