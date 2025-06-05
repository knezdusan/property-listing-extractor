export type AppModal = {
  appModalComponentName: string | null;
  setAppModalComponentName: (modal: string | null) => void;
};

export type AppContext = {
  appModal: AppModal;
};
