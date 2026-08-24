const fs = require('fs');
let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebar = sidebar.replace(
`                      </span>
                    )}
                  </button>
              )}
                  </div>
              )}`,
`                      </span>
                    )}
                  </button>
                </div>
              )}`
);
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);
