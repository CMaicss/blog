> {
>   "title": "翻译：GNU tar 格式",
>   "datetime": "2022年7月8日 13:05"
> }

> 原文链接：https://www.gnu.org/software/tar/manual/html_node/Standard.html#Standard

虽然一个归档文件可能包含许多文件，但归档文件本身是一个普通的文件。像其他文件一样，归档文件可以被写入存储设备，如磁带或磁盘，通过管道或网络发送，保存在活动文件系统中，甚至存储在另一个归档文件中。如果不使用GNU Emacs中的tar工具或Tar模式，一个归档文件是不容易阅读或操作的。

从物理上讲，一个归档文件由一系列的文件条目组成，以一个归档结束条目为终点，该条目由两个512的零字节块组成。一个文件条目通常描述归档文件中的一个文件（一个存档成员），由一个文件头和文件内容组成。文件头包含文件名和统计信息、用来检测文件损坏的校验信息，以及关于文件类型的信息。

归档允许有一个以上具有相同文件名的文件。例如：如果一个文件有多个版本被存储在归档中。有关将文件的新版本添加到存档中的信息，请参阅更新存档。

除了描述归档成员的条目外，归档可能包含tar本身用来存储信息的条目。参见 "在归档中包括一个标签 "一节中这种归档条目的例子。

一个tar归档文件包含一系列的块。每个块包含BLOCKSIZE字节。虽然这种格式通常是在磁带上，但也经常用于其他介质。

每个被归档的文件都有一个描述文件的头块，后面是零个或多个提供文件内容的块。在归档文件的末尾，有两个512字节的块，充满二进制的零，作为文件结束的标记。一个合理的系统应该在归档文件的末尾写上这样的文件结束标记，但在读取归档文件时不能假定有这样的块存在。如果GNU tar没有检测到它，就会发出警告。

这些块可能会被物理I/O操作所阻断。每条n个块的记录用一个`write()`操作写入。（其中n是由tar的`-blocking-factor=512-size`或`-b 512-size`选项设置的）在磁带上，这样写得到的是一条记录。当写一个归档文件时，最后记录的块应该以全尺寸写入，零块之后的块都是零。读取档案时，合理的系统应正确处理最后一条记录比其他记录短的档案，或在零块之后含有垃圾记录的档案。

这个头文件块在C语言中定义如下。在GNU tar发行版中，这是文件'src/tar.h'的一部分。

```c
/* tar Header Block, from POSIX 1003.1-1990.  */

/* POSIX header.  */

struct posix_header
{                              /* 字节偏移量 */
  char name[100];               /*   0 */
  char mode[8];                 /* 100 */
  char uid[8];                  /* 108 */
  char gid[8];                  /* 116 */
  char size[12];                /* 124 */
  char mtime[12];               /* 136 */
  char chksum[8];               /* 148 */
  char typeflag;                /* 156 */
  char linkname[100];           /* 157 */
  char magic[6];                /* 257 */
  char version[2];              /* 263 */
  char uname[32];               /* 265 */
  char gname[32];               /* 297 */
  char devmajor[8];             /* 329 */
  char devminor[8];             /* 337 */
  char prefix[155];             /* 345 */
                                /* 500 */
};

#define TMAGIC   "ustar"        /* ustar 和 null */
#define TMAGLEN  6
#define TVERSION "00"           /* 00 并且没有 null */

/* typeflag 字段中用到的值  */
#define REGTYPE  '0'            /* 普通文件 */
#define AREGTYPE '\0'           /* 普通文件 */
#define LNKTYPE  '1'            /* 硬链接 */
#define SYMTYPE  '2'            /* 保留字段，但GNU中为软连接（符号链接） */
#define CHRTYPE  '3'            /* 特殊字符 */
#define BLKTYPE  '4'            /* 特殊块 */
#define DIRTYPE  '5'            /* 文件夹 */
#define FIFOTYPE '6'            /* FIFO special */
#define CONTTYPE '7'            /* 保留字段，但GNU中描述连续文件*/
#define XHDTYPE  'x'            /* 指向归档中下一个文件的扩展标头 */
#define XGLTYPE  'g'            /* 全局扩展标头 */

/* 在模式字段中使用的字节，数值为八进制。 */
#define TSUID    04000          /* set UID on execution */
#define TSGID    02000          /* set GID on execution */
#define TSVTX    01000          /* 保留文件权限 */
                                /* file permissions */
#define TUREAD   00400          /* 所有者可读 */
#define TUWRITE  00200          /* 所有者可写 */
#define TUEXEC   00100          /* 所有者可执行 */
#define TGREAD   00040          /* 所有组可读 */
#define TGWRITE  00020          /* 所有组可写 */
#define TGEXEC   00010          /* 所有组可执行 */
#define TOREAD   00004          /* 其他人可读 */
#define TOWRITE  00002          /* 其他人可写 */
#define TOEXEC   00001          /* 其他人可执行 */

/* tar标头块，GNU扩展  */

/* 在GNU tar中，SYMTYPE用于符号链接，CONTTYPE是用于连续文件，因此可能与
   POSIX头中写的“保留”注释存在出入，我怀疑这些东西本来就是要这样使用的，而
   且在公布的标准中不应该真的被“保留” */

/* *注意* 以下信息仍然在讨论中，未来可能会发生变化，即使OLDGNU格式的描述应
   该是准确的，所谓的GNU格式还没有完全确定，它肯定是为了只使用POSIX允许的扩
   展，但下面的草案中仍然存在一些OLDGNU格式中应当被解决的缺陷：稀疏的文件的
   保存应当不需要在创建归档时出里两次。过大的文件会使一些POSIX字段溢出，必
   须为此寻求解决方案。*/

/* 单个文件孔的描述符 */

struct sparse
{                              /* 字节偏移量 */
  char offset[12];              /*   0 */
  char numbytes[12];            /*  12 */
                                /*  24 */
};

/* 在POSIX ustar格式中不支持稀疏文件。对于带有POSIX标头的稀疏文件，提供了
   一个保存了整体的稀疏信息和一些稀疏描述符的GNU扩展标头， 当一个旧的GNU标
   头取代了POSIX标头和GNU扩展标头时，它也可以存放一些稀疏描述符。无论是否
   是POSIX，如果需要更多的稀疏描述符，它们需要被放入连续的稀疏标头中，下面
   的常量告诉我们每一种能够容纳稀疏描述符的标头中可容纳多少个稀疏描述符。 */

#define SPARSES_IN_EXTRA_HEADER  16
#define SPARSES_IN_OLDGNU_HEADER 4
#define SPARSES_IN_SPARSE_HEADER 21

/* 稀疏文件的扩展标头，紧随在GNU额外头之后使用，只有在所有的稀疏信息无法被额外
   头容纳时才使用。甚至可以有很多这样的扩展标头，一个接一个，直到所有的稀疏信息
   都被记录下来。 */

struct sparse_header
{                              /* byte offset */
  struct sparse sp[SPARSES_IN_SPARSE_HEADER];
                                /*   0 */
  char isextended;              /* 504 */
                                /* 505 */
};

/* 旧GNU格式标头和POSIX的冲突如下：POSIX贵方文件可能会欺骗旧的GNU tar，反之
   亦然。一个旧的GNU格式标头使用了POSIX标头中的prefix字段所使用的空间，并积累
   了通常在 GNU 额外头中发现的信息。对于旧的GNU tar标头，我们永远无法看到任何
   POSIX标头或GNU扩展标头。然而补充性的稀疏头文件是允许的。 */

struct oldgnu_header
{                              /* byte offset */
  char unused_pad1[345];        /*   0 */
  char atime[12];               /* 345 Incr. archive: atime of the file */
  char ctime[12];               /* 357 Incr. archive: ctime of the file */
  char offset[12];              /* 369 Multivolume archive: the offset of
                                   the start of this volume */
  char longnames[4];            /* 381 Not used */
  char unused_pad2;             /* 385 */
  struct sparse sp[SPARSES_IN_OLDGNU_HEADER];
                                /* 386 */
  char isextended;              /* 482 Sparse file: Extension sparse header
                                   follows */
  char realsize[12];            /* 483 Sparse file: Real size*/
                                /* 495 */
};

/* OLDGNU_MAGIC同时使用连续的magic和version两个字段。在归档文件中发现，它表示一个
   希望被淘汰的旧的GNU头格式。 用OLDGNU_MAGIC，uname和gname是有效的，尽管标头并不
   真正符合 POSIX 标准。 */
#define OLDGNU_MAGIC "ustar  "  /* 7和字符和一个null */
/* 标准委员会只允许大写A到大写Z的用户定义扩展。 其他使用的字母包括：

   'A' Solaris访问控制列表
   'E' Solaris扩展属性文件
   'I' 只有Inode，如'star'
   'N' 过时的GNU tar，用于不适合主标头的文件名
   'X' POSIX 1003.1-2001 eXtended (VU version)  */

/* 这是一个dir条目，包含了转储时dir中的文件名。 */
#define GNUTYPE_DUMPDIR 'D'

/* 表示磁带上的下一个文件有一个长链接名。  */
#define GNUTYPE_LONGLINK 'K'

/* 表示磁带上的下一个文件有一个很长的文件名。  */
#define GNUTYPE_LONGNAME 'L'

/* 这是在另一卷上开始的文件的延续。  */
#define GNUTYPE_MULTIVOL 'M'

/* 这是针对稀疏文件的。 */
#define GNUTYPE_SPARSE 'S'

/* 这个文件是一个磁带/卷的标头，需要在提取时忽略它。 */
#define GNUTYPE_VOLHDR 'V'

/* Solaris扩展标头 */
#define SOLARIS_XHDTYPE 'X'

/* Jörg Schilling star header */


struct star_header
{                              /* 位偏移量 */
  char name[100];               /*   0 */
  char mode[8];                 /* 100 */
  char uid[8];                  /* 108 */
  char gid[8];                  /* 116 */
  char size[12];                /* 124 */
  char mtime[12];               /* 136 */
  char chksum[8];               /* 148 */
  char typeflag;                /* 156 */
  char linkname[100];           /* 157 */
  char magic[6];                /* 257 */
  char version[2];              /* 263 */
  char uname[32];               /* 265 */
  char gname[32];               /* 297 */
  char devmajor[8];             /* 329 */
  char devminor[8];             /* 337 */
  char prefix[131];             /* 345 */
  char atime[12];               /* 476 */
  char ctime[12];               /* 488 */
                                /* 500 */
};

#define SPARSES_IN_STAR_HEADER      4
#define SPARSES_IN_STAR_EXT_HEADER  21

struct star_in_header
{
  char fill[345];       /*   0  在t_prefix之前的所有内容 */
  char prefix[1];       /* 345  t_name 的前缀 */
  char fill2;           /* 346  */
  char fill3[8];        /* 347  */
  char isextended;      /* 355  */
  struct sparse sp[SPARSES_IN_STAR_HEADER]; /* 356  */
  char realsize[12];    /* 452  文件的实际大小 */
  char offset[12];      /* 464  多卷内容的偏移 */
  char atime[12];       /* 476  */
  char ctime[12];       /* 488  */
  char mfill[8];        /* 500  */
  char xmagic[4];       /* 508  "tar" */
};

struct star_ext_header
{
  struct sparse sp[SPARSES_IN_STAR_EXT_HEADER];
  char isextended;
};

```

标头块中的所有字符都使用ASCII的本地变体中的8位字符来表示。结构中的每个字段都是连续的；也就是说，结构中没有使用填充物。归档介质上的每个字符都是连续存储的。

代表文件内容的字节（在每个文件的标头块之后）不以任何方式翻译，也不被限制为代表任何字符集的字符。tar格式不区分文本文件和二进制文件，也不对文件内容进行翻译。

name、linkname、magic、uname和gname是“空尾”的字符串。所有额外字段都是ASCII中的零填充的八进制数字。每个宽度为w的数字字段可包含最大为w-1的数字，以及一个空值。(在扩展的GNU格式中，数字字段可以采用其他形式)。

name字段是文件的名称和目录名称（如果有的话）在文件名称前面，用“/”分开。

模式字段提供了9位指定文件权限和3位指定设置UID、设置GID和保存文本（粘性）模式。这些位的值在上面定义。当需要特殊的权限来创建一个给定模式的文件，而从存档中恢复文件的用户不具备这样的权限时，指定这些特殊权限的模式位会被忽略。从存档中恢复文件的操作系统不支持的模式将被忽略。在创建或更新归档文件时，不支持的模式应该是伪造的；例如，可以从其他权限中复制组的权限。

uid和gid字段分别是文件所有者的数字用户和组ID。如果操作系统不支持数字用户或组ID，这些字段应被忽略。

size字段是文件的大小，以字节为单位；链接文件在归档时该字段指定为零。

mtime字段代表文件被归档时的数据修改时间。它代表自1970年1月1日00:00协调世界时以来的整数秒。

chksum字段表示标头块中所有字节的简单总和。标头中的每个8位字节都被添加到一个无符号整数中，初始化为0，其精度应不低于17位。在计算校验和时，chksum字段被视为全部为空。

typeflag字段指定归档文件的类型。如果某个特定的实现不承认或不允许指定的类型，则该文件将被看作是一个普通文件被提取。当这个动作发生时，tar会向标准错误发出一个警告。

atime和ctime字段用于做增量备份；它们分别存储特定文件的访问时间和状态变化时间。

当使用`--volume`或`-M`选项制作多卷存档时。偏移量是文件中需要重新开始的字节数，以便在下一盘磁带上继续使用该文件，也就是说，我们把继续使用的文件的位置存储在哪里。

为了处理稀疏文件，增加了以下字段。如果一个文件吸收了未分配的最终被表示为零的块，即无用的数据，那么这个文件是稀疏的。判断一个文件是否稀疏的方法是看为它分配的块数与文件中的字符数；如果为文件分配的块数少于通常为该大小的文件分配的块数，那么该文件就是稀疏的。这就是tar用来检测稀疏文件的方法，一旦检测到这样的文件，它的处理方式就与非稀疏文件不同。

稀疏文件通常是`dbm`文件，或其他数据库类型的文件，它们在某些地方有数据，而在文件的大部分地方是空的。这样的文件在 `ls -l`的时候会显得非常大，而事实上，文件中可能只包含了非常少的重要数据。因此，tar认为它必须备份整个文件是不可取的，因为大量的空间被浪费在空块上，这可能导致磁带上的空间远远超过必要的时间。因此，稀疏文件的处理方法是，这些空块不会被写入磁带。相反，写到磁带上的是对稀疏文件的描述：洞在哪里，洞有多大，以及在洞的末端有多少数据。这样一来，文件在磁带上所占的空间就可能小得多，以后提取文件的时候，就会和之前的样子一模一样。下面是用于处理稀疏文件的字段的描述。

`sp`是一个`sparse`结构的数组。每个`struct sparse`包含两个12个字符的字符串，分别代表文件的偏移量和要在该偏移量上写入的字节数。偏移量是绝对的，而不是相对于前面的数组元素中的偏移量。

标头目前可以容纳四个这样的struct sparse；如果需要更多，则不存储在标头。

当需要用扩展标头来处理一个文件时，`isextended`标志被设置。请注意，这意味着只有在处理稀疏文件时才能设置这个标志，而且只有在文件的标头无法分配给稀疏结构体空间时才会设置。换句话说，需要一个扩展头。

扩展头结构用于需要更多稀疏结构体的稀疏文件，而这些稀疏结构在标头中是无法容纳的。标头可以容纳4个这样的结构；如果需要更多的结构，设置isextended标志，则下一个块就是扩展头。

每个extend\_header结构包含一个由21个稀疏结构组成的数组，同时还有一个类似于header的isextended标志。可以有不确定数量的这种extend\_headers来描述一个稀疏文件。

#### REGTYPE/AREGTYPE

这些标志代表一个常规文件。为了与旧版本的tar兼容，AREGTYPE 的类型标志值应该被默认识别为一个常规文件。新的归档文件应该用REGTYPE标志。另外，为了向后兼容，tar把名字以斜线结尾的普通文件看作是一个目录。

#### LNKTYPE

这个标志代表一个文件与另一个任何类型的以存档的文件相连。这样的文件在Unix中通过每个文件具有相同的设备和inode号来识别。链接到的名称在linkname字段中指定，后面是空的。

#### SYMTYPE

这代表一个符号链接。被链接的名称在linkname字段中指定，尾部为空。

#### CHRTYPE/BLKTYPE

这些分别代表字符特殊文件和块特殊文件。在这种情况下，devmajor和devminor字段将分别包含主要和次要的设备编号。操作系统可以将设备规格映射到他们自己的本地规格，也可以忽略这个条目。

#### DIRTYPE

这个标志指定了一个目录或子目录。名称字段中的目录名称应以斜线结尾。在以目录为基础进行磁盘分配的系统中，大小字段将包含该目录可以容纳的最大字节数（可以四舍五入到最近的磁盘块分配单位）。大小字段为0表示没有这种限制，不支持以这种方式限制的系统应该忽略大小字段。

#### FIFOTYPE

这指定了一个FIFO特殊文件。注意，FIFO文件的归档是归档这个文件的存在，而不是其内容。

#### CONTTYPE

这指定了一个连续的文件，它与普通文件相同，只是在支持它的操作系统中，它的所有空间都是在磁盘上连续分配的。不允许连续分配的操作系统应该默默地把这种类型当作普通文件。

#### A...Z

这些都是保留给自定义实现的。其中一些被用于GNU修改过的格式中，如下所述。

其他值保留在P1003标准的未来修订中进行规范，不应该被任何tar程序使用。

magic字段表示此存档是以P1003存档格式输出的。如果该字段包含TMAGIC，uname和gname字段将分别包含该文件的所有者和组的ASCII表示。如果找到，则使用用户和组的ID，而不是uid和gid字段中的值。

关于参考资料，见ISO/IEC 9945-1:1990或IEEE标准1003.1-1990，第169-173页（10.1节）的存档/交换文件格式；以及IEEE标准1003.2-1992，第380-388页（4.48节）和第936-940页（E.4.48节）的pax - 便携式存档交换。
