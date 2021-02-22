import * as goldenLayoutConfig from "./golden-layout-config.js";

var myLayout = new window.GoldenLayout(
  goldenLayoutConfig.structure,
  $("#layoutContainer")
);
var myLayoutState = null;

myLayout.registerComponent("component", function(container, state) {
  container.getElement().html("<h2>" + state.text + "</h2>");
});

myLayout.init();

function getContainersById(id) {
  var containers = myLayout.root.getItemsByFilter(function(item) {
    if (item.config.type != "component" && hasId(item)) {
      var itemId = JSON.parse(item.config.id).id;
      return itemId == id;
    }
    return false;
  });

  return containers;
}

function createColumnContainer(columnId) {
  var mainContainer = getContainersById(goldenLayoutConfig.mainContainerId)[0];

  if (mainContainer == null) {
    return;
  }

  var columnIndex = null;

  switch (columnId) {
    case goldenLayoutConfig.columnsIds.MAP:
      columnIndex = 0;
      break;

    case goldenLayoutConfig.columnsIds.PRIMARY:
      columnIndex = 1;
      break;

    case goldenLayoutConfig.columnsIds.SECUNDARY:
      columnIndex = 2;
      break;

    default:
      columnIndex = mainContainer.contentItems.length;
      break;
  }

  mainContainer.addChild(
    { id: JSON.stringify({ id: columnId }), type: "column" },
    columnIndex
  );

  var columnContainer = getContainersById(columnId)[0];

  return columnContainer;
}

function createMainContainer() {
  myLayout.root.addChild({
    id: JSON.stringify({ id: goldenLayoutConfig.mainContainerId }),
    type: "row",
    isClosable: false
  });
}

function createPageContainer(
  columnContainer,
  pageContainerId = null,
  pageContainerOrder = null
) {
  if (pageContainerOrder == null) {
    if (columnContainer.contentItems.length > 0) {
      pageContainerOrder = columnContainer.contentItems.length;
    } else {
      pageContainerOrder = 0;
    }
  }

  columnContainer.addChild(
    {
      id: JSON.stringify({
        id: pageContainerId,
        columnId: JSON.parse(columnContainer.config.id).id,
        containerOrderInColumn: pageContainerOrder
      }),
      type: "stack"
    },
    pageContainerOrder
  );

  var pageContainer = columnContainer.contentItems[pageContainerOrder];

  return pageContainer;
}

function pageIsLoaded(pageTitle) {
  var result = false;

  var mainContainer = getContainersById(goldenLayoutConfig.mainContainerId)[0];

  if (mainContainer == null) {
    return;
  }

  //Percorre as colunas do container principal
  for (let i = 0; i < mainContainer.contentItems.length; i = i + 1) {
    if (pageExistInColumnContainer(mainContainer.contentItems[i], pageTitle)) {
      result = true;
      break;
    }
  }

  return result;
}

function pageExistInColumnContainer(columnContainer, pageTitle) {
  var result = false;

  //Percorre todas as páginas (abas) do container
  for (let i = 0; i < columnContainer.contentItems.length; i = i + 1) {
    if (pageExistInContainer(columnContainer.contentItems[i], pageTitle)) {
      result = true;
      break;
    }
  }

  return result;
}

function pageExistInContainer(container, pageTitle) {
  var result = false;

  if (container.type == "stack" || container != null) {
    for (let i = 0; i < container.contentItems.length; i = i + 1) {
      if (container.contentItems[i].config.title == pageTitle) {
        result = true;
        break;
      }
    }
  }

  return result;
}

function addPageInContainer(pageContainer, page, pageOrder = null) {
  if (pageOrder == null) {
    if (pageContainer.contentItems.length > 0) {
      pageOrder = pageContainer.contentItems.length - 1;
    } else {
      pageOrder = 0;
    }
  }

  if (pageExistInContainer(pageContainer, page.title) == false) {
    pageContainer.addChild(page, pageOrder);
  }
}

function addPage(
  page,
  columnId,
  pageContainerId = null,
  pageContainerOrder = null,
  pageOrder = null
) {
  //Verifica se a página já está carregada
  if (pageIsLoaded(page.title)) {
    return;
  }

  updateLayout();

  var pageContainer = null;
  var columnContainer = null;

  if (pageContainerId != null) {
    pageContainer = getContainersById(pageContainerId)[0];
  }
  if (pageContainer == null) {
    if (columnId != null) {
      columnContainer = getContainersById(columnId)[0];

      //Verifica se a coluna não existe OU se a página não existe na coluna
      if (columnContainer == null) {
        columnContainer = createColumnContainer(columnId);
      }
    }

    pageContainer = createPageContainer(
      columnContainer,
      pageContainerId,
      pageContainerOrder
    );
    // if (pageContainer == null){
    //     pageContainer = createPageContainer(columnContainer, pageContainerId, pageContainerOrder);
    // }
  }

  addPageInContainer(pageContainer, page, pageOrder);
}

function hasId(container) {
  if (container.hasOwnProperty("config")) {
    if (container.config.hasOwnProperty("id")) {
      return true;
    }
  }

  return false;
}

function updateLayout() {
  var containersTocheck = myLayout.root.getItemsByType("stack");

  for (let i = 0; i < containersTocheck.length; i = i + 1) {
    if (!hasId(containersTocheck[i])) {
      continue;
    }

    var containerId = JSON.parse(containersTocheck[i].config.id).id;
    var containerColumnId = JSON.parse(containersTocheck[i].config.id).columnId;
    var containerOrderInColumn = JSON.parse(containersTocheck[i].config.id)
      .containerOrderInColumn;

    if (containerColumnId == null) {
      continue;
    }

    //Coluna na qual o container deveria estar
    var columnContainer = getContainersById(containerColumnId)[0];

    //Container superior atual do container
    var currentContainer = containersTocheck[i].parent;
    var currentContainerId = JSON.parse(currentContainer.config.id).id;

    //Verifica se o container está no container correto
    if (containerColumnId == currentContainerId) {
      continue;
    }

    currentContainer.removeChild(containersTocheck[i], true);

    if (columnContainer == null) {
      columnContainer = createColumnContainer(containerColumnId);
    }

    columnContainer.addChild(containersTocheck[i], containerOrderInColumn);
  }
}

//Eventos - Click
function addPageMapa() {
  addPage(
    {
      title: "Mapa",
      type: "component",
      componentName: "component",
      componentState: { text: "Mapa" }
    },
    goldenLayoutConfig.columnsIds.MAP
  );
}

function addPageCentral() {
  addPage(
    {
      title: "Central",
      type: "component",
      componentName: "component",
      componentState: { text: "Central" }
    },
    goldenLayoutConfig.columnsIds.PRIMARY,
    goldenLayoutConfig.primaryStandardPagesContainerId,
    0,
    0
  );
}

function addPagePlanejamento() {
  addPage(
    {
      title: "Planejamento",
      type: "component",
      componentName: "component",
      componentState: { text: "Planejamento" }
    },
    goldenLayoutConfig.columnsIds.PRIMARY,
    goldenLayoutConfig.primaryStandardPagesContainerId,
    0,
    2
  );
}

function addPageEventos() {
  addPage(
    {
      title: "Eventos",
      type: "component",
      componentName: "component",
      componentState: { text: "Eventos" }
    },
    goldenLayoutConfig.columnsIds.PRIMARY,
    goldenLayoutConfig.primaryStandardPagesContainerId,
    0,
    1
  );
}

function addPageRonda() {
  var pageTitle = "Ronda " + Math.floor(Math.random() * 9999) + 1;
  addPage(
    {
      title: pageTitle,
      type: "component",
      componentName: "component",
      componentState: { text: pageTitle }
    },
    goldenLayoutConfig.columnsIds.PRIMARY,
    "ronda",
    null,
    0
  );
}

function addPageRota() {
  var pageTitle = "Rota " + Math.floor(Math.random() * 9999) + 1;
  addPage(
    {
      title: pageTitle,
      type: "component",
      componentName: "component",
      componentState: { text: pageTitle }
    },
    goldenLayoutConfig.columnsIds.SECUNDARY,
    "rota",
    null,
    0
  );
}

function addButtonInMenu(text, clickFunction) {
  var element = $("<li>" + text + "</li>");
  $("#menuContainer").append(element);
  element.click(clickFunction);
}

function createLayout() {
  createMainContainer();

  addPageMapa();
  addPageCentral();
  addPageEventos();
  addPagePlanejamento();

  //Botões do menu
  addButtonInMenu("Add 'Mapa'", addPageMapa);
  addButtonInMenu("Add 'Central'", addPageCentral);
  addButtonInMenu("Add 'Planejamento'", addPagePlanejamento);
  addButtonInMenu("Add 'Eventos'", addPageEventos);
  addButtonInMenu("Add 'Editar/Criar Ronda'", addPageRonda);
  addButtonInMenu("Add 'Editar/Criar Rota'", addPageRota);
}

addButtonInMenu("Criar layout", createLayout);
